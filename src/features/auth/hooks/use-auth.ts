'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '@/features/auth/api/auth';
import { onboardingApi } from '@/features/onboarding/api/onboarding';
import { useAuthStore } from '@/stores/auth-store';
import type {
  LoginDto,
  SignupDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  FindIdDto,
  UserDto,
} from '@/api/generated/schemas';
import { isAxiosError } from '@/services/interceptors/auth';
import { clearAllCaches } from '@/lib/sw-cache';

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
};

/**
 * 현재 사용자 정보 조회
 * - 호출처: ProfileCard (/mypage), MockAuthToggle (dev), useLogin.onSuccess 의 fetchQuery
 * - 다른 컴포넌트는 store(useAuthStore) 의 cached user 만 사용 (UI 표시용)
 *
 * **initialData**: store 의 persisted user (localStorage) 를 첫 render 의 seed 로.
 * mount 즉시 `isLoading: false + isSuccess: true` → UI 즉시 표시 (FOUC 회피).
 *
 * **initialDataUpdatedAt**: 0 (epoch) → staleTime 즉시 만료 → 백그라운드 refetch 트리거.
 * persisted user 가 잠시 stale 인 동안 사용 가능 + 백엔드 변경 곧 반영.
 */
export function useMe(
  options?: Omit<UseQueryOptions<UserDto>, 'queryKey' | 'queryFn'>,
) {
  const persistedUser = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: authKeys.me(),
    // generated 함수는 (signal?) → Promise<UserDto>. react-query 의 queryFn 은
    // ({signal, ...}) 객체 받으므로 lambda 로 signal 만 분리해 전달.
    queryFn: ({ signal }) => authApi.me(signal),
    initialData: persistedUser,
    initialDataUpdatedAt: 0,
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
    mutationFn: (data: LoginDto) => authApi.login(data),
    onSuccess: async () => {
      // 로그인 후 /me 재조회하여 상태 hydrate
      const user = await queryClient.fetchQuery({
        queryKey: authKeys.me(),
        queryFn: ({ signal }) => authApi.me(signal),
      });
      setAuth(user);
      // 로그인 성공 → 원래 가려던 경로 (LoginForm 이 ?redirect= 로 전달) 또는 홈.
      // open-redirect 차단은 LoginForm 에서 처리 (`startsWith('/')`).
      //
      // 회귀 사유 — `router.replace + router.refresh` 조합 race 누적:
      //   · (auth) → (main) 라우트 그룹 교체 + RSC client router cache stale payload
      //   · refresh 가 replace 보다 먼저 발사되어 현재 (/login) RSC 갱신 → paint 정지
      // 사용자 보고 "redirect=%2Fmypage 도 안 됨" — 위 race 누적 증상.
      //
      // Fix — hard navigation. 비용은 1회 full reload, 보상은:
      //   · middleware 가 새 요청에서 SID cookie 정합 검증 → 보호 경로 통과
      //   · client router cache 완전 우회
      //   · refresh 불필요
      const target = options?.redirectTo ?? '/';
      window.location.assign(target);
    },
  });
}

export function useSignup() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    // BE SignupDto 가 nickname 안 받음 — UserDto 응답에만 있음. FE 가 입력받은
    // nickname 을 signup 직후 complete-onboarding 으로 patch 하는 2-step.
    // BE 가 SignupDto 에 nickname 추가 시 본 chain 한 줄 합치고 patch 제거 가능.
    mutationFn: async (data: SignupDto & { nickname?: string }) => {
      const { nickname, ...signupData } = data;
      const response = await authApi.signup(signupData);
      if (nickname) {
        await onboardingApi.complete({ nickname });
      }
      return response;
    },
    onSuccess: (response) => {
      // BE 가 가입 + 세션 발급을 atomic 처리 — Set-Cookie: SID + { user: UserDto }.
      // FE 는 별도 login/me 호출 불필요 — 응답의 user 그대로 store / cache hydrate.
      setAuth(response.user);
      queryClient.setQueryData(authKeys.me(), response.user);
      // 첫 가입 → onboarding 으로. middleware 의 visited cookie redirect 와 일치.
      router.replace('/onboarding');
      router.refresh();
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (data: ForgotPasswordDto) => authApi.forgotPassword(data),
  });
}

export function useResetPassword() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  return useMutation({
    mutationFn: (data: ResetPasswordDto) => authApi.resetPassword(data),
    onSuccess: async () => {
      // 비번 변경 후 기존 세션 즉시 무효화.
      // BE 가 reset 시 세션을 자동 invalidate 안 할 가능성 대비 — 명시 logout 호출로
      // SID cookie 정리. HttpOnly 라 JS 로 직접 제거 불가 — BE 의 logout endpoint 가
      // Set-Cookie 만료(Max-Age=0)로 정리. 정리 후 새 비번으로 /login 진입 가능.
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
    mutationFn: (data: ChangePasswordDto) => authApi.changePassword(data),
  });
}

export function useFindId() {
  return useMutation({
    mutationFn: (data: FindIdDto) => authApi.findId(data),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  return useMutation({
    // void variables 보장 위해 lambda wrap — generated 함수는 `(signal?)` 시그니처라
    // mutate() 가 variables 필수가 되는 회귀 회피.
    mutationFn: () => authApi.logout(),
    onSettled: async () => {
      // 성공/실패 모두 클라이언트 상태는 비운다
      clearAuth();
      queryClient.clear();
      // Service Worker 캐시 비우기 — 다음 사용자가 이전 응답을 보는 것 방지
      await clearAllCaches();
      // hard nav — useLogin 과 일관. soft router.replace 는 RSC payload / client
      // router cache 잔재 위험 (이전 로그인 상태의 query 결과 / layout). 홈은 public
      // 이라 middleware 통과. 보호 경로 직접 진입 시도 시 middleware 가 /login 처리.
      window.location.assign('/');
    },
  });
}

/**
 * 회원 탈퇴 — DELETE /me. BE 가 소프트 삭제 + 세션 무효 후 204 응답.
 * onSuccess 흐름은 useLogout 와 동일 — clearAuth + queryClient.clear + sw cache clear + 홈.
 * 차이점: 실패 시에도 onSettled 로 cleanup (탈퇴 의도 표시 — 사용자가 다시 들어가면 안 됨).
 */
export function useDeleteAccount() {
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  return useMutation({
    mutationFn: () => authApi.deleteAccount(),
    onSettled: async (_data, error) => {
      // 실패해도 client cleanup — 사용자가 탈퇴 confirm 까지 했으므로 의도 명확.
      // (BE 가 이미 처리했지만 네트워크 timeout 같은 경우 client 상태는 cleanup.)
      if (!error) {
        clearAuth();
        queryClient.clear();
        await clearAllCaches();
      }
      // hard nav — useLogin / useLogout 과 일관 (RSC cache 잔재 회피).
      window.location.assign('/');
    },
  });
}
