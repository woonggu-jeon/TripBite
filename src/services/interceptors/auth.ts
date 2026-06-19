import type { AxiosError, AxiosInstance } from 'axios';
import axios from 'axios';

/**
 * 401 처리 — sessionID 단일 방식
 *
 * 한국 표준 (네이버 / 카카오 / 대형 포털) 의 sessionID 쿠키 모델:
 *   - 단일 cookie (HttpOnly, SameSite=Lax) 가 sessionID 보관
 *   - BE 가 매 요청마다 cookie → DB/Redis 세션 조회로 검증
 *   - 만료 시 BE 가 cookie 폐기 + 401. FE 는 보호 경로에서만 /login 으로 보냄
 *
 * 정책:
 *   - 401 받으면 그대로 reject (refresh 시도 X)
 *   - **보호 경로 (/mypage, /settings, /letter, /notifications) 에 있을 때만**
 *     hard redirect '/login' — 비로그인으로 둘러볼 수 있는 public 페이지
 *     (/, /region, /quiz, /tournament 등) 에서는 401 silent reject 만 하고
 *     페이지 그대로 유지.
 *   - auth 페이지 (/login, /signup, /find-id, /forgot-password,
 *     /reset-password, /onboarding) 에서도 hard redirect skip — 무한 루프 회피.
 *   - mock 환경 (USE_MSW=true) 도 hard redirect skip — MockAuthToggle 이 unauth
 *     UX 자체 처리.
 */

/**
 * 미인증 시 강제 로그인 이동 대상 경로.
 * docs/FEATURES.md §A 의 보호 경로 정책 + middleware.ts 의 PROTECTED_PATHS 와 동기.
 */
const PROTECTED_PATHS = ['/mypage', '/settings', '/letter', '/notifications'];

/**
 * 이미 인증 페이지인지 검사 — hard redirect 무한 루프 회피.
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

/**
 * 보호 경로에 있는지 — 401 시 hard redirect 대상.
 * public 페이지 (메인 / 시군 / 토너먼트 setup / 퀴즈 등) 는 비로그인 사용자도
 * 자유롭게 둘러볼 수 있도록 redirect 안 함.
 */
function isOnProtectedPath(): boolean {
  if (typeof window === 'undefined') return false;
  const p = window.location.pathname;
  return PROTECTED_PATHS.some((pp) => p === pp || p.startsWith(`${pp}/`));
}

export function attachAuthInterceptor(instance: AxiosInstance) {
  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      // 401 만 hard redirect 대상. 그 외는 그대로 throw.
      if (!error.response || error.response.status !== 401) {
        return Promise.reject(error);
      }

      const isMock = process.env.NEXT_PUBLIC_USE_MSW === 'true';
      if (
        !isMock &&
        !isAlreadyOnAuthPage() &&
        isOnProtectedPath() &&
        typeof window !== 'undefined'
      ) {
        // store import 시 순환참조 위험 → 직접 redirect.
        // 현재 path 를 redirect query 로 보존 — 로그인 후 복귀 (login/onboarding
        // 의 safeRedirectParam 가 `/` 시작 + `//` 차단 검증 후 사용).
        const path = window.location.pathname + window.location.search;
        const safe =
          path && path.startsWith('/') && !path.startsWith('//') ? path : '/';
        window.location.href = `/login?redirect=${encodeURIComponent(safe)}`;
      }
      return Promise.reject(error);
    },
  );
}

// (선택) 외부에서 사용할 axios 에러 가드
export function isAxiosError(err: unknown): err is AxiosError {
  return axios.isAxiosError(err);
}
