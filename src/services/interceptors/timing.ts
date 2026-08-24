import type { AxiosInstance } from 'axios';
import { track } from '@/features/analytics';
import { createLogger } from '@/lib/logger';

const log = createLogger('api');

/**
 * API 응답 시간 측정 interceptor
 *
 * 책임:
 *   - 요청 시작 시점 기록
 *   - 응답/에러 시점에 duration 계산
 *   - 임계값 초과 시 경고 (개발) / 분석 도구 전송 (운영)
 *
 * 측정 대상:
 *   - TourAPI 프록시 (느릴 가능성 높음)
 *   - 토너먼트 후보 여행지 조회
 *   - 편지함 페이지네이션
 *   - 그 외 모든 백엔드 호출
 *
 * 운영 활용:
 *   - 1초 초과 호출은 analytics 로 전송 → 백엔드 최적화 우선순위 결정
 *   - p95 / p99 추적 가능
 *
 * 별도 interceptor 파일로 분리:
 *   - auth interceptor 의 단일 책임 유지
 *   - 비활성화도 attach 안 하면 끝
 */

declare module 'axios' {
  // axios config 에 metadata 필드 추가 (요청 시작 시각)
  interface InternalAxiosRequestConfig {
    metadata?: { startTime: number };
  }
}

const SLOW_THRESHOLD_MS = 1000;

export function attachTimingInterceptor(client: AxiosInstance): void {
  client.interceptors.request.use((config) => {
    config.metadata = { startTime: performance.now() };
    return config;
  });

  client.interceptors.response.use(
    (response) => {
      const start = response.config.metadata?.startTime ?? 0;
      const duration = performance.now() - start;
      report(
        response.config.url ?? '',
        response.status,
        duration,
        response.config.method,
      );
      return response;
    },
    (error) => {
      const start = error.config?.metadata?.startTime ?? 0;
      const duration = performance.now() - start;
      const status = error.response?.status ?? 0;
      // 요청 취소(navigation/unmount 시 AbortController) — 서버 에러 아님.
      const canceled =
        error.code === 'ERR_CANCELED' || error.name === 'CanceledError';
      report(
        error.config?.url ?? '',
        status,
        duration,
        error.config?.method,
        true,
        canceled,
      );
      return Promise.reject(error);
    },
  );
}

/**
 * API 호출 리포트 — **개발**: 모든 호출을 소요시간과 함께 레벨별(색상) 로깅
 * (정상 info / 느림 warn / 에러 error). **운영**: 로거 silent(노출 X) + slow/error 만 analytics.
 */
function report(
  url: string,
  status: number,
  duration: number,
  method?: string,
  isError = false,
  canceled = false,
) {
  const slow = duration > SLOW_THRESHOLD_MS;
  // query string은 PII 가능성 있어 제거 — pathname만
  const pathname = extractPath(url);
  const duration_ms = Math.round(duration);
  const m = (method ?? 'GET').toUpperCase();

  // 미인증(401/403)은 에러가 아니라 정상 인증 신호(로그인 필요/세션만료).
  const isAuthStatus = status === 401 || status === 403;
  // status 0 = HTTP 응답 없음(취소/네트워크 중단) — 서버 에러 아님.
  const isNoResponse = status === 0;
  // 실제 서버 에러만 error 레벨. 취소는 debug, 무응답/인증/느림은 warn 으로 강등해
  // dev 콘솔이 "빨간 에러"로 오인되는 것 방지.
  // dev: 색상 레벨로 소요시간 노출. prod/test: logger silent → 미출력.
  const level = canceled
    ? 'debug'
    : isError && !isAuthStatus && !isNoResponse
      ? 'error'
      : slow || isAuthStatus || (isError && isNoResponse)
        ? 'warn'
        : 'info';
  log[level](
    { method: m, status, pathname, duration_ms, slow, canceled },
    `${m} ${pathname} → ${status} ${duration_ms}ms${slow ? ' (slow)' : ''}`,
  );

  // 운영 분석 채널 — slow / 실 서버에러만. 취소·무응답·401/403 은 제외(지표 오염 방지).
  if (process.env.NODE_ENV !== 'development') {
    if (slow) track('api.slow', { pathname, status, duration_ms });
    if (isError && !isAuthStatus && !isNoResponse && !canceled)
      track('api.error', { pathname, status, duration_ms });
  }
}

function extractPath(rawUrl: string): string {
  try {
    // axios url은 상대일 수 있어 dummy origin으로 파싱
    return new URL(rawUrl, 'http://x').pathname;
  } catch {
    return rawUrl.split('?')[0] ?? rawUrl;
  }
}
