import axios, { type AxiosInstance } from 'axios';
import { attachAuthInterceptor } from '@/services/interceptors/auth';
import { attachTimingInterceptor } from '@/services/interceptors/timing';

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
  },
});

// Interceptor 부착
//   - timing: 응답 시간 측정 (느린 API 감지) — 먼저 부착
//   - auth:   401 → refresh → 재시도
attachTimingInterceptor(api);
attachAuthInterceptor(api);
