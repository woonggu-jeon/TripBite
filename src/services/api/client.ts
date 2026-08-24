import axios, { type AxiosInstance } from 'axios';
import { assertRequiredEnv } from '@/lib/env';
import { attachAuthInterceptor } from '@/services/interceptors/auth';
import { attachErrorNormalizeInterceptor } from '@/services/interceptors/error-normalize';
import { attachTimingInterceptor } from '@/services/interceptors/timing';

// 클라이언트 부팅 시 필수 env 검증 (미설정 시 콘솔 경고)
assertRequiredEnv();

/**
 * 아키텍처 — same-origin proxy 단일화.
 * - 항상 baseURL='/api/be' → next.config.js rewrites 가 운영 BE 로 proxy.
 * - withCredentials: true → cookie 자동 전송 (same-origin 이라 default 동작).
 * - HttpOnly Cookie 기반 인증 — FE 는 token 직접 다루지 않음.
 *
 * Same-origin 의 효과:
 *   - Chrome 시크릿 / 3rd-party cookie 차단 무관 (vercel.app same-site)
 *   - CORS preflight 불필요
 *   - 향후 Chrome 의 3rd-party cookie phase-out 면역
 *
 * **서버(RSC) 분기 (2026-08-15)**: 브라우저는 same-origin 프록시(`/api/be`)를
 * 쓰지만, RSC 프리페치는 rewrite 가 없어 절대 BE URL 이 필요하다. `window` 부재 시
 * `NEXT_PUBLIC_API_URL`(Spring origin) 직접 호출. `api` 는 여태 클라 전용이라 이 분기는
 * additive — 클라 동작 불변. (공개 데이터 프리페치용이라 쿠키 불필요.)
 */
const baseURL =
  typeof window === 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL ?? '/api/be')
    : '/api/be';

export const api: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
    // BE 의 CSRF guard 통과용 — `X-Requested-With: XMLHttpRequest` 가 있으면
    // non-simple request 로 분류되어 preflight 가 trigger 되므로 단순 form
    // submit 으로 위조 불가 (CSRF 보호 유지). cross-origin 운영 (Vercel ↔
    // trip-bite.o-r.kr) 의 표준 패턴. BE 합의 — 2026-06-11.
    'X-Requested-With': 'XMLHttpRequest',
  },
});

/**
 * 요청 정규화 interceptor.
 *
 * (구 NestJS `/v1` prefix 제거 로직은 Spring 전환으로 삭제 — Spring server url 에
 *  버전 prefix 가 없어 generated client 도 `/auth/login` 처럼 prefix 없이 호출.)
 */
api.interceptors.request.use((config) => {
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
