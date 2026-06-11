import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/types';

/**
 * 아키텍처 문서 13, 15번
 *
 * 핵심 원칙:
 * - 토큰은 절대 저장하지 않는다 (HttpOnly Cookie가 담당)
 * - Zustand에는 최소 정보만 (isAuthenticated, user)
 * - 서버 데이터를 Zustand에 두는 것은 금지 (TanStack Query가 담당)
 *
 * **persist (localStorage)** — `/me` 응답을 디바이스에 저장.
 * AuthBootstrap 이 mount 즉시 cached user 사용 → onboarding 분기 즉시 결정 → FOUC 회피.
 * `/me` 백그라운드 refetch 로 server truth 갱신 (TanStack Query 의 staleTime 정책).
 *
 * 보안: HttpOnly cookie (SID) 가 인증 단일 source. localStorage 의 user 는 UX 가속용.
 * 로그아웃 시 clearAuth 가 store + cache 모두 비움.
 */

type AuthState = {
  isAuthenticated: boolean;
  user?: User;
};

type AuthActions = {
  setAuth: (user: User) => void;
  clearAuth: () => void;
};

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
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    },
  ),
);
