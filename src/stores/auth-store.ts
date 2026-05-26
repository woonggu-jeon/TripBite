import { create } from 'zustand';
import type { User } from '@/features/user/types';

/**
 * 아키텍처 문서 13, 15번
 *
 * 핵심 원칙:
 * - 토큰은 절대 저장하지 않는다 (HttpOnly Cookie가 담당)
 * - Zustand에는 최소 정보만 (isAuthenticated, user)
 * - 서버 데이터를 Zustand에 두는 것은 금지 (TanStack Query가 담당)
 *
 * user 객체는 /me 응답을 임시 보관하는 용도 정도로만 사용한다.
 * 가능하면 useQuery(['me']) 결과를 직접 쓰는 게 더 좋음.
 */

type AuthState = {
  isAuthenticated: boolean;
  user?: User;
};

type AuthActions = {
  setAuth: (user: User) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  isAuthenticated: false,
  user: undefined,

  setAuth: (user) => set({ isAuthenticated: true, user }),
  clearAuth: () => set({ isAuthenticated: false, user: undefined }),
}));
