import type {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';
import axios from 'axios';

/**
 * 아키텍처 문서 11, 16번
 *
 * Refresh Flow:
 *   401 발생 → POST /auth/refresh → 새 access token 쿠키 발급 → 원래 요청 재시도
 *
 * 핵심 원칙:
 * - 프론트는 토큰을 직접 보지 않음 (모두 HttpOnly Cookie)
 * - 동시에 발생한 401들은 단일 refresh 요청을 공유 (중복 방지)
 */

// refresh 엔드포인트 — 백엔드와 합의된 경로 사용
const REFRESH_URL = '/auth/refresh';
// 401 발생 시에도 refresh 시도하지 않을 경로
const SKIP_REFRESH_URLS = ['/auth/login', '/auth/refresh', '/auth/logout'];

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<void> | null = null;

function isSkippedUrl(url: string | undefined): boolean {
  if (!url) return false;
  return SKIP_REFRESH_URLS.some((skip) => url.includes(skip));
}

/**
 * 이미 인증 페이지(또는 onboarding) 라면 hard redirect 안 함.
 * AuthBootstrap 이 모든 페이지에서 useMe() 를 부르는데, /login 등 미인증
 * 페이지의 useMe 가 401 → refresh 401 → hard redirect '/login' → 페이지 reload
 * → 또 useMe 401 → ... 무한 루프 회피.
 */
function isAlreadyOnAuthPage(): boolean {
  if (typeof window === 'undefined') return false;
  const p = window.location.pathname;
  return (
    p === '/login' ||
    p.startsWith('/login/') ||
    p === '/signup' ||
    p.startsWith('/signup/') ||
    p === '/find-id' ||
    p === '/forgot-password' ||
    p === '/reset-password' ||
    p === '/onboarding' ||
    p.startsWith('/onboarding/')
  );
}

export function attachAuthInterceptor(instance: AxiosInstance) {
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as RetryableConfig | undefined;

      // 네트워크 에러 / config 없음
      if (!originalRequest || !error.response) {
        return Promise.reject(error);
      }

      const status = error.response.status;
      const url = originalRequest.url;

      // 401 외엔 그대로 throw
      if (status !== 401) {
        return Promise.reject(error);
      }

      // 이미 재시도했거나, refresh 자체가 실패한 경우
      if (originalRequest._retry || isSkippedUrl(url)) {
        // 인증 실패 확정 → 로그인 페이지로 (운영 한정).
        // mock 환경 (USE_MSW=true) 에선 hard redirect 안 함 — AuthBootstrap 의
        // client-side 가드 + MockAuthToggle 토글이 unauth UX 를 자체 처리.
        // 운영에서는 session 만료 = 강제 재로그인 정책 유지.
        const isMock = process.env.NEXT_PUBLIC_USE_MSW === 'true';
        if (
          !isMock &&
          !isAlreadyOnAuthPage() &&
          typeof window !== 'undefined'
        ) {
          // store를 import하면 순환참조 위험이 있으므로 직접 redirect
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        // 동시 401들이 단일 refresh 공유
        if (!refreshPromise) {
          refreshPromise = instance
            .post(REFRESH_URL)
            .then(() => undefined)
            .finally(() => {
              refreshPromise = null;
            });
        }

        await refreshPromise;

        // 원래 요청 재시도 (쿠키는 자동 갱신됨)
        return instance(originalRequest);
      } catch (refreshError) {
        refreshPromise = null;
        const isMock = process.env.NEXT_PUBLIC_USE_MSW === 'true';
        if (
          !isMock &&
          !isAlreadyOnAuthPage() &&
          typeof window !== 'undefined'
        ) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    },
  );
}

// (선택) 외부에서 사용할 axios 에러 가드
export function isAxiosError(err: unknown): err is AxiosError {
  return axios.isAxiosError(err);
}
