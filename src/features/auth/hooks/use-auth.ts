'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '@/features/auth/api/auth';
import { useAuthStore } from '@/stores/auth-store';
import type { LoginRequest } from '@/features/auth/types';
import type { User } from '@/features/user/types';
import { isAxiosError } from '@/services/interceptors/auth';
import { clearAllCaches } from '@/lib/sw-cache';

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
};

/**
 * 현재 사용자 정보 조회
 * - AuthBootstrap에서 한 번 호출 후 cache에 보관
 * - 다른 컴포넌트는 store(useAuthStore) 또는 이 hook을 통해 접근
 */
export function useMe(
  options?: Omit<UseQueryOptions<User>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: authApi.me,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      // 401은 미인증 상태로 간주 (재시도 X)
      if (isAxiosError(error) && error.response?.status === 401) {
        return false;
      }
      return failureCount < 1;
    },
    ...options,
  });
}

export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: async () => {
      // 로그인 후 /me 재조회하여 상태 hydrate
      const user = await queryClient.fetchQuery({
        queryKey: authKeys.me(),
        queryFn: authApi.me,
      });
      setAuth(user);
      // 로그인 성공 → 홈 (하단 네비 첫 항목)
      router.replace('/');
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: async () => {
      // 성공/실패 모두 클라이언트 상태는 비운다
      clearAuth();
      queryClient.clear();
      // Service Worker 캐시 비우기 — 다음 사용자가 이전 응답을 보는 것 방지
      await clearAllCaches();
      router.replace('/login');
    },
  });
}
