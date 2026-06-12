import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
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
};

type AuthActions = {
  setAuth: (user: UserDto) => void;
  clearAuth: () => void;
};

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

      setAuth: (user) => set({ isAuthenticated: true, user }),
      clearAuth: () => set({ isAuthenticated: false, user: undefined }),
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
