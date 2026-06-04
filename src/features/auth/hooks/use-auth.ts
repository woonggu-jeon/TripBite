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
import type {
  LoginRequest,
  SignupRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  FindIdRequest,
} from '@/features/auth/types';
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

export function useSignup() {
  const router = useRouter();
  return useMutation({
    mutationFn: (data: SignupRequest) => authApi.signup(data),
    onSuccess: () => {
      // 가입 완료 → 로그인 페이지로 (자동 로그인 안 함)
      router.replace('/login?signup=success');
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (data: ForgotPasswordRequest) => authApi.forgotPassword(data),
  });
}

export function useResetPassword() {
  const router = useRouter();
  return useMutation({
    mutationFn: (data: ResetPasswordRequest) => authApi.resetPassword(data),
    onSuccess: () => {
      router.replace('/login?reset=success');
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => authApi.changePassword(data),
  });
}

export function useFindId() {
  return useMutation({
    mutationFn: (data: FindIdRequest) => authApi.findId(data),
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
      // 로그아웃 후 메인 화면 — middleware 가 미인증 시 자동으로 /login 으로 보냄
      router.replace('/');
    },
  });
}
