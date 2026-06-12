import axios, { type AxiosInstance } from 'axios';
import { attachAuthInterceptor } from '@/services/interceptors/auth';
import { attachTimingInterceptor } from '@/services/interceptors/timing';
import { attachErrorNormalizeInterceptor } from '@/services/interceptors/error-normalize';
import { assertRequiredEnv } from '@/lib/env';

// 클라이언트 부팅 시 필수 env 검증 (미설정 시 콘솔 경고)
assertRequiredEnv();

/**
 * 아키텍처 — same-origin proxy 단일화.
 * - 항상 baseURL='/api/backend' → next.config.js rewrites 가 운영 BE 로 proxy.
 * - withCredentials: true → cookie 자동 전송 (same-origin 이라 default 동작).
 * - HttpOnly Cookie 기반 인증 — FE 는 token 직접 다루지 않음.
 *
 * Same-origin 의 효과:
 *   - Chrome 시크릿 / 3rd-party cookie 차단 무관 (vercel.app same-site)
 *   - CORS preflight 불필요
 *   - 향후 Chrome 의 3rd-party cookie phase-out 면역
 */
const baseURL = '/api/backend';

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
 * baseURL='/api/backend' + rewrite destination=`${NEXT_PUBLIC_API_URL}/:path*` 구성.
 * env 말미에 `/v1` 포함 (예: `https://tripbite.duckdns.org/v1`) — 즉 `/v1` 은 env 가 보유.
 * orval generated client 는 `/v1/auth/login` 같은 prefix 포함 URL 을 호출하므로
 * 그대로 두면 final URL 이 `${target}/v1/v1/auth/login` 으로 중복 → 404.
 *
 * 모든 요청 url 에서 선행 `/v1/` 제거 — generated(`/v1/auth/login`) → `/auth/login` →
 * `/api/backend/auth/login` → rewrite → `${target}/auth/login` 으로 BE 의 `/v1/` 정확 매핑.
 * 수동 코드(`/auth/login`)는 interceptor 영향 없음.
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
