'use client';

import {
  type UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
// 신규 Spring BE SignupRequestDto (username/password/name/birthDate/email/phone/nickname).
import type { SignupRequestDto as SignupInput } from '@/api/be/schemas';
import { authApi } from '@/features/auth/api/auth';
import { clearAllCaches } from '@/lib/sw-cache';
import { isAxiosError } from '@/services/interceptors/auth';
import { useAuthStore } from '@/stores/auth-store';
import type { LoginDto, UserDto } from '@/types/api-domain';

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
      // 미인증은 재시도 무의미 — 구 NestJS 401, 새 Spring 403 둘 다.
      const s = isAxiosError(error) ? error.response?.status : undefined;
      if (s === 401 || s === 403) return false;
      return failureCount < 1;
    },
    ...options,
  });
}

export function useLogin(options?: { redirectTo?: string }) {
  // useRouter() 미사용 — hard nav (window.location.assign) 로 group 교체.
  // 사유: (auth) → (main) router.replace + refresh race 회귀 (아래 주석 참조).
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
  const setPendingSignupUser = useAuthStore((s) => s.setPendingSignupUser);

  return useMutation({
    mutationFn: (data: SignupInput) => authApi.signup(data),
    // 신규 Spring BE signup 응답은 ApiResponseUnit (user 없음). 세션은 BE 가 발급
    // (mock 은 setMockSignedIn) — pendingSignupUser 는 폼 입력값으로 구성(완료 화면의
    // 닉네임 표시용). 시작하기 클릭 후 useMe 가 /me 로 실제 프로필 hydrate.
    onSuccess: (_response, variables) => {
      setPendingSignupUser({
        id: '',
        username: variables.username ?? '',
        nickname: variables.nickname ?? '',
        email: variables.email ?? '',
      });
      router.replace('/signup/complete');
      router.refresh();
    },
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
