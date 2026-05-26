import type { AxiosInstance } from 'axios';

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
      report(response.config.url ?? '', response.status, duration);
      return response;
    },
    (error) => {
      const start = error.config?.metadata?.startTime ?? 0;
      const duration = performance.now() - start;
      const status = error.response?.status ?? 0;
      report(error.config?.url ?? '', status, duration, true);
      return Promise.reject(error);
    },
  );
}

function report(url: string, status: number, duration: number, isError = false) {
  const slow = duration > SLOW_THRESHOLD_MS;

  if (process.env.NODE_ENV === 'development') {
    if (slow || isError) {
      // eslint-disable-next-line no-console
      console.warn(
        `[api${slow ? ':slow' : ''}${isError ? ':error' : ''}] ${status} ${url} ${duration.toFixed(0)}ms`,
      );
    }
    return;
  }

  // 운영 전송 예시 (도입 시 활성화):
  //
  // import { track } from '@/features/analytics';
  // if (slow) {
  //   track('api.slow' as never, { url, status, duration } as never);
  // }
  //
  // 또는 Sentry breadcrumb / metrics 로 전송.
}
