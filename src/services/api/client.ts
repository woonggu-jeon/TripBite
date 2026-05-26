import axios, { type AxiosInstance } from 'axios';
import { attachAuthInterceptor } from '@/services/interceptors/auth';
import { attachTimingInterceptor } from '@/services/interceptors/timing';

/**
 * 아키텍처 문서 10번
 * - withCredentials: true → 쿠키 자동 전송
 * - HttpOnly Cookie 기반이므로 프론트는 토큰을 직접 다루지 않음
 */
export const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
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
