import axios, { type AxiosInstance } from 'axios';
import { attachAuthInterceptor } from '@/services/interceptors/auth';
import { attachTimingInterceptor } from '@/services/interceptors/timing';
import { attachErrorNormalizeInterceptor } from '@/services/interceptors/error-normalize';
import { assertRequiredEnv } from '@/lib/env';

// 클라이언트 부팅 시 필수 env 검증 (미설정 시 콘솔 경고)
assertRequiredEnv();

/**
 * 아키텍처 문서 10번
 * - withCredentials: true → 쿠키 자동 전송
 * - HttpOnly Cookie 기반이므로 프론트는 토큰을 직접 다루지 않음
 *
 * baseURL 분기:
 *   - MSW 모드: '/api/backend' (same-origin) → next.config.js rewrites가 백엔드로 proxy.
 *     service worker가 same-origin 요청만 가로챌 수 있으므로 필수 우회 경로.
 *   - 평소: NEXT_PUBLIC_API_URL 그대로 (cross-origin 직접 호출)
 */
const baseURL =
  process.env.NEXT_PUBLIC_USE_MSW === 'true'
    ? '/api/backend'
    : process.env.NEXT_PUBLIC_API_URL;

export const api: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
    // BE 의 CSRF guard 통과용 — `X-Requested-With: XMLHttpRequest` 가 있으면
    // non-simple request 로 분류되어 preflight 가 trigger 되므로 단순 form
    // submit 으로 위조 불가 (CSRF 보호 유지). cross-origin 운영 (Vercel ↔
    // tripbite.duckdns.org) 의 표준 패턴. BE 합의 — 2026-06-11.
    'X-Requested-With': 'XMLHttpRequest',
  },
});

/**
 * NestJS versioning prefix 정규화.
 *
 * baseURL 이 이미 `/v1` 을 포함하는 환경(예: NEXT_PUBLIC_API_URL=http://localhost:3000/v1)에서
 * orval 이 생성한 client 가 `/v1/auth/login` 같은 prefix 포함 URL 을 호출하면
 * 최종 URL 이 `.../v1/v1/auth/login` 으로 중복 → 404.
 *
 * 모든 요청 url 에서 선행 `/v1/` 를 제거 — 기존 수동 코드(`/auth/login`)는 그대로,
 * generated client(`/v1/auth/login`)는 자동으로 `/auth/login` 으로 정규화.
 * baseURL 에 `/v1` 가 없는 환경(예: BE 가 versioning 끄거나 staging) 에서는
 * 호출자가 그냥 prefix 없이 호출하면 됨 — interceptor 영향 없음.
 */
api.interceptors.request.use((config) => {
  if (config.url?.startsWith('/v1/')) {
    config.url = config.url.replace(/^\/v1\//, '/');
  }
  // FormData (multipart) 요청 — defaults.headers 의 `application/json` 강제 unset.
  // 명시 헤더가 있으면 axios 가 그대로 보내며 boundary 가 누락되어 BE multipart
  // parse 실패 회귀 (`{code: 'VALIDATION', message: '이미지 파일이 필요합니다.'}`).
  // unset 하면 axios + 브라우저가 boundary 포함한 multipart Content-Type 자동 설정.
  if (
    typeof FormData !== 'undefined' &&
    config.data instanceof FormData &&
    config.headers
  ) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// Interceptor 부착
//   - timing:     응답 시간 측정 (느린 API 감지) — 먼저 부착
//   - error-norm: 모든 응답 에러에 { code, message } 표준 속성 부여
//   - auth:       401 → refresh → 재시도 (error-norm 보다 뒤 — refresh 분기가 흐름 가로채는 게 우선)
attachTimingInterceptor(api);
attachErrorNormalizeInterceptor(api);
attachAuthInterceptor(api);
