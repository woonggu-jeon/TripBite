'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
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

export function useLogin(options?: { redirectTo?: string }) {
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
      // 로그인 성공 → 원래 가려던 경로 (LoginForm 이 ?redirect= 로 전달) 또는 홈.
      // dynamic path 라 typedRoutes 강제 캐스팅 필요 (open-redirect 차단은 LoginForm 에서 처리).
      //
      // router.refresh() — RSC cache 강제 갱신.
      // 회귀: 첫 로그인 시 replace 만 호출하면 next/server 의 RSC payload 가
      // 미인증 시점 cache 를 그대로 들고 있어 navigate 가 paint 안 됨 (사용자
      // 보고 "다시 클릭하면 이동"). refresh 가 새 cookie 로 RSC 재요청 → 정상 paint.
      router.replace((options?.redirectTo ?? '/') as Route);
      router.refresh();
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
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  return useMutation({
    mutationFn: (data: ResetPasswordRequest) => authApi.resetPassword(data),
    onSuccess: async () => {
      // 비번 변경 후 기존 세션 즉시 무효화.
      // BE 가 reset 시 세션을 자동 invalidate 안 할 가능성 대비 — 명시 logout 호출로
      // SID cookie 정리. SID 가 살아있으면 /login 진입을 middleware 가 / 로 차단해
      // 사용자가 새 비번으로 다시 로그인 불가능한 회귀가 생김. HttpOnly 라 JS 로
      // cookie 직접 제거 불가 — BE 의 logout endpoint 가 Set-Cookie 만료로 정리.
      try {
        await authApi.logout();
      } catch {
        // logout 실패 (이미 세션 없거나 401) — 무시. 다음 navigate 진행.
      }
      clearAuth();
      queryClient.clear();
      router.replace('/login?reset=success');
      router.refresh();
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
