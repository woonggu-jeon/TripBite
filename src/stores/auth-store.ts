import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { UserDto } from '@/api/generated/schemas';

/**
 * 아키텍처 문서 13, 15번
 *
 * 핵심 원칙:
 * - 토큰은 절대 저장하지 않는다 (HttpOnly Cookie가 담당)
 * - Zustand에는 최소 정보만 (isAuthenticated, user)
 * - 서버 데이터를 Zustand에 두는 것은 금지 (TanStack Query가 담당)
 *
 * **persist (localStorage)** — 로그인 시 `/me` 응답을 디바이스에 저장.
 * 페이지 reload 후에도 cached user 즉시 사용 → AppHeader/ProfileCard UI 표시 가속.
 * 다른 기기 변경 사항 동기화: `/mypage` 진입 시 ProfileCard 의 useMe 가 background
 * refetch — 다른 보호 경로 진입 시엔 stale 허용 (다음 reload/navigation 까지).
 *
 * **보안 — persist 의 PII 최소화 (2026-06-12)**:
 * HttpOnly cookie (SID) 가 인증 단일 source. localStorage 는 UX 가속용 cache 라
 * email / id 같은 PII 평문 저장 시 XSS 1회 노출 위험. UI 표시에 실제 필요한
 * `nickname / avatarUrl / isOnboarded / homeRegion / travelType` 만 persist.
 * 메모리 내 state (in-memory user) 는 그대로 전체 — `useMe` refetch 시 server
 * 응답으로 곧 보강. 새로고침 직후 UI 가 잠깐 minimal 정보로 보이는 게 trade-off.
 */

/** localStorage 에 저장되는 user subset — PII (email/id/username) 제외. */
type PersistedUser = Pick<
  UserDto,
  'nickname' | 'avatarUrl' | 'isOnboarded' | 'homeRegion' | 'travelType'
>;

type AuthState = {
  isAuthenticated: boolean;
  user?: UserDto;
  /**
   * 회원가입 직후 /signup/complete 의 시작하기 클릭 전까지 보존되는 user.
   *
   * 흐름: useSignup onSuccess → setPendingSignupUser → /signup/complete →
   * 사용자가 "시작하기" 클릭 → setAuth(pendingSignupUser) + clearPendingSignupUser.
   *
   * persist 미포함 (메모리 only) — 새로고침 시 사라짐 → /signup/complete 직접
   * 진입 가드 가능. UI 흐름상 가입 ≠ 로그인 분리 (BE 는 atomic SID 발급하지만
   * FE store/cache 는 시작하기 클릭 시점에 hydrate).
   */
  pendingSignupUser?: UserDto;
};

type AuthActions = {
  setAuth: (user: UserDto) => void;
  clearAuth: () => void;
  setPendingSignupUser: (user: UserDto | undefined) => void;
};

/**
 * 미들웨어 인증 마커 쿠키 (2026-08 Spring 전환).
 *
 * 새 Spring BE 는 익명 요청에도 JSESSIONID 를 항상 발급 → 미들웨어가 세션 쿠키
 * 존재만으로 로그인 판정 불가 (익명도 쿠키 있음 → 보호경로 게이팅 무력화 + 로그아웃
 * 사용자가 /login 진입 불가). 따라서 **FE 가 실제 인증 여부를 나타내는 non-HttpOnly
 * 마커 쿠키**를 관리하고, 미들웨어는 이 마커를 본다 (`tripbite.visited` 와 동일 패턴).
 *
 * setAuth → 마커 set, clearAuth → 마커 clear. 로그인/로그아웃/세션만료(interceptor)/
 * AuthBootstrap(/me 결과) 이 전부 이 두 함수를 거치므로 마커가 자동 동기화된다.
 * API 403 이 실제 인증 게이트 — 마커는 UX(SSR redirect)용 신호일 뿐.
 */
const AUTH_MARKER_COOKIE = 'tripbite.authed';

function writeAuthMarker(authed: boolean): void {
  if (typeof document === 'undefined') return;
  const secure = location.protocol === 'https:' ? '; secure' : '';
  document.cookie = authed
    ? `${AUTH_MARKER_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax${secure}`
    : `${AUTH_MARKER_COOKIE}=; path=/; max-age=0; samesite=lax${secure}`;
}

function toPersistedUser(user: UserDto | undefined): PersistedUser | undefined {
  if (!user) return undefined;
  return {
    nickname: user.nickname,
    avatarUrl: user.avatarUrl,
    isOnboarded: user.isOnboarded,
    homeRegion: user.homeRegion,
    travelType: user.travelType,
  };
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: undefined,
      pendingSignupUser: undefined,

      setAuth: (user) => {
        writeAuthMarker(true);
        set({ isAuthenticated: true, user });
      },
      clearAuth: () => {
        writeAuthMarker(false);
        set({
          isAuthenticated: false,
          user: undefined,
          pendingSignupUser: undefined,
        });
      },
      setPendingSignupUser: (user) => set({ pendingSignupUser: user }),
    }),
    {
      name: 'tripbite.auth',
      storage: createJSONStorage(() => localStorage),
      // PII 축소 — email/id/username 은 localStorage 미저장. 새 setAuth 시 메모리
      // 전체 채워지고, refresh 후엔 useMe refetch 가 다시 서버에서 가져옴.
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: toPersistedUser(state.user) as UserDto | undefined,
      }),
    },
  ),
);
