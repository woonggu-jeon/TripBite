import axios, { type AxiosInstance } from 'axios';
import { attachAuthInterceptor } from '@/services/interceptors/auth';

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
attachAuthInterceptor(api);
