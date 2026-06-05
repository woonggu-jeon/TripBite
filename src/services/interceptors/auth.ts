import type { AxiosError, AxiosInstance } from 'axios';
import axios from 'axios';

/**
 * 401 처리 — sessionID 단일 방식
 *
 * 한국 표준 (네이버 / 카카오 / 대형 포털) 의 sessionID 쿠키 모델:
 *   - 단일 cookie (HttpOnly, SameSite=Lax) 가 sessionID 보관
 *   - BE 가 매 요청마다 cookie → DB/Redis 세션 조회로 검증
 *   - 만료 시 BE 가 cookie 폐기 + 401. FE 는 /login 으로 보냄
 *   - revocation 즉시 가능 (관리자 강제 로그아웃 / 보안 사고)
 *
 * → JWT access/refresh rotation 같은 클라이언트 측 갱신 로직 불필요.
 *
 * 정책:
 *   - 401 받으면 그대로 reject (refresh 시도 X)
 *   - auth 페이지 (/login, /signup, /find-id, /forgot-password,
 *     /reset-password, /onboarding) 에서는 hard redirect 안 함 — 페이지
 *     자체가 미인증 흐름이라 reload 무한 루프 회피
 *   - mock 환경 (USE_MSW=true) 도 hard redirect 안 함 — AuthBootstrap +
 *     MockAuthToggle 이 unauth UX 자체 처리
 *   - 나머지는 window.location.href = '/login' (강제 재로그인)
 */

/**
 * 이미 인증 페이지인지 검사 — hard redirect 무한 루프 회피.
 * AuthBootstrap 이 모든 페이지에서 useMe() 를 부르는데, /login 의 useMe 가 401 →
 * hard redirect '/login' → 페이지 reload → 또 useMe 401 → ... 무한.
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
    (error: AxiosError) => {
      // 401 만 hard redirect 대상. 그 외는 그대로 throw.
      if (!error.response || error.response.status !== 401) {
        return Promise.reject(error);
      }

      const isMock = process.env.NEXT_PUBLIC_USE_MSW === 'true';
      if (!isMock && !isAlreadyOnAuthPage() && typeof window !== 'undefined') {
        // store import 시 순환참조 위험 → 직접 redirect
        window.location.href = '/login';
      }
      return Promise.reject(error);
    },
  );
}

// (선택) 외부에서 사용할 axios 에러 가드
export function isAxiosError(err: unknown): err is AxiosError {
  return axios.isAxiosError(err);
}
