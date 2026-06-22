import type { AxiosError, AxiosInstance } from 'axios';
import axios from 'axios';

/**
 * 세션 만료 toast 중복 표시 방지 — module-level flag.
 *
 * 사용자 보고 (2026-06-19): polling (notifications/unread-count 등) 이 401
 * 반복 시 toast 폭주. 한 세션 한 번만 표시. setAuth (재로그인) 시 reset.
 * 보호 경로 redirect 는 hard nav (window.location.href) 라 페이지 reload →
 * module 변수 자연 reset.
 */
let sessionExpiredToastShown = false;
export function __resetSessionExpiredFlag(): void {
  sessionExpiredToastShown = false;
}

/**
 * 401 처리 — sessionID 단일 방식 + BE code 기반 분기 (2026-06-22 BE 응답 정합)
 *
 * 한국 표준 (네이버 / 카카오 / 대형 포털) 의 sessionID 쿠키 모델:
 *   - 단일 cookie (HttpOnly, SameSite=Lax) 가 sessionID 보관
 *   - BE 가 매 요청마다 cookie → DB/Redis 세션 조회로 검증
 *   - 만료 시 BE 가 401 + Set-Cookie 로 SID 자동 만료 (cleanup)
 *
 * **BE code 기반 분기 (2026-06-22)**:
 *   401 status 만으로 일괄 처리하면 로그인 폼의 비번 틀림 (AUTH_INVALID_CREDENTIALS)
 *   까지 자동 로그아웃 분기에 걸려 redirect 루프 발생.
 *   → `data.code === 'AUTH_REQUIRED'` 만 자동 로그아웃 분기.
 *   → 다른 401 (AUTH_INVALID_CREDENTIALS 등) 은 silent reject → 호출처가 처리.
 *
 * **auth endpoint 제외**: /v1/auth/(login|signup|check-*|find-id|
 *   forgot-password|reset-password) 호출에서 발생한 401 은 자동 로그아웃 안 함
 *   (호출처 폼이 인라인 에러 표시).
 *
 * 정책:
 *   - 401 + code=AUTH_REQUIRED + non-auth endpoint → clearAuth + (보호 경로) redirect
 *   - **보호 경로 (/mypage, /settings, /letter, /notifications)** → hard redirect '/login'
 *   - 그 외 페이지 → clearAuth 만 (silent, UI 자동 비로그인 전환)
 *   - auth 페이지 / mock 환경 → redirect skip (무한 루프 / mock UX 자체 처리)
 *
 * BE 는 401 응답에 Set-Cookie SID=; Max-Age=0 자동 포함 — FE 가 cookie 청소 불필요.
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

/**
 * Auth endpoint 호출에서 발생한 401 인지 — 호출처 폼이 자체 처리 (BE 응답 §4).
 * /v1/auth/(login|signup|check-username|check-email|find-id|forgot-password|
 * reset-password) 매칭. axios baseURL 기준 path 만 검사.
 */
function isAuthEndpoint(requestUrl: string | undefined): boolean {
  if (!requestUrl) return false;
  return /\/v1\/auth\/(login|signup|check-username|check-email|find-id|forgot-password|reset-password)\b/.test(
    requestUrl,
  );
}

export function attachAuthInterceptor(instance: AxiosInstance) {
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      // 401 만 처리 대상. 그 외는 그대로 throw.
      if (!error.response || error.response.status !== 401) {
        return Promise.reject(error);
      }

      // BE code 기반 분기 (2026-06-22) — AUTH_REQUIRED 만 자동 로그아웃 분기.
      // AUTH_INVALID_CREDENTIALS / 기타 401 은 호출처가 처리 (인라인 에러 등).
      const data = error.response.data as { code?: string } | undefined;
      const code = data?.code;
      if (code !== 'AUTH_REQUIRED') {
        return Promise.reject(error);
      }

      // Auth endpoint (/v1/auth/login 등) 호출에서 발생한 401 은 자동 로그아웃
      // 안 함 — 호출처 폼이 자체 처리 (BE 응답 §4 루프 방지 체크리스트).
      if (isAuthEndpoint(error.config?.url)) {
        return Promise.reject(error);
      }

      const isMock = process.env.NEXT_PUBLIC_USE_MSW === 'true';
      const onAuthPage = isAlreadyOnAuthPage();

      // public 경로에서 401 자동 로그아웃 처리 — 탈퇴/세션만료 사용자의 stale
      // store 동기화. BE 가 응답에 Set-Cookie SID 만료 헤더 자동 포함하므로
      // FE 는 cookie 청소 불필요.
      if (!isMock && !onAuthPage && typeof window !== 'undefined') {
        const { useAuthStore } = await import('@/stores/auth-store');
        const wasAuthenticated = useAuthStore.getState().isAuthenticated;
        useAuthStore.getState().clearAuth();

        if (wasAuthenticated && !sessionExpiredToastShown) {
          sessionExpiredToastShown = true;
          window.dispatchEvent(new CustomEvent('auth:session-expired'));
        }
      }

      if (
        !isMock &&
        !onAuthPage &&
        isOnProtectedPath() &&
        typeof window !== 'undefined'
      ) {
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
