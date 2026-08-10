'use client';

import { useQueryClient } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { authApi } from '@/features/auth/api/auth';
import { authKeys } from '@/features/auth/hooks/use-auth';
import { useAuthStore } from '@/stores/auth-store';

/**
 * AuthBootstrap — 세션 프로브(/me) only. 렌더 X, 부수효과만.
 *
 * 책임 (2026-08-10 재활성):
 *   앱 로드당 1회 GET /me 로 실제 세션을 확정한다.
 *     · 200 → setAuth(user)   → isAuthenticated=true,  sessionResolved=true
 *     · 403 → clearAuth()      → isAuthenticated=false, sessionResolved=true
 *   유저 스코프 폴링(useAuthedQueryEnabled)은 sessionResolved 확정 후에만 발사되므로,
 *   로드타임에 authed 요청은 이 /me 하나뿐 — stale 낙관 인증으로 인한 배지 403 소멸.
 *
 * 인증 / Onboarding **redirect 는 middleware(SSR) 책임** — 여기선 절대 네비게이션 안 함
 * (2026-06-12 에 redirect 로직 때문에 mount 를 껐던 회귀를 재발 방지: /me 동기화만 남김).
 * 보호경로에서 세션이 없으면 interceptor(403) 의 hard redirect 가 처리.
 *
 * initialData 우회 — useMe() 는 persisted user 를 seed 로 즉시 isSuccess 가 되어
 * 리페치 실패(403)가 isError 로 안 잡히는 react-query 함정이 있다. 프로브는 실제
 * 네트워크 결과가 필요하므로 queryClient.fetchQuery 로 직접 /me 를 때려 resolve/reject
 * 를 명확히 구분한다 (결과는 authKeys.me() 캐시에 반영 → ProfileCard 등이 공유).
 *
 * `/signup/complete` 예외 (2026-06-19): 가입 직후 SID 로 /me 200 이 "자동 로그인"이
 * 되는 것을 막기 위해 setAuth skip (시작하기 클릭 시 명시적 setAuth). 단 세션 확정은
 * 필요하므로 skip 시에도 sessionResolved 는 세팅(clearAuth 대신 markSessionResolved).
 */

const SETAUTH_SKIP_PATHS = ['/signup/complete'];

export function AuthBootstrap() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const pathname = usePathname();

  useEffect(() => {
    const skipSetAuth = SETAUTH_SKIP_PATHS.includes(pathname);
    let cancelled = false;

    queryClient
      .fetchQuery({
        queryKey: authKeys.me(),
        queryFn: ({ signal }) => authApi.me(signal),
      })
      .then((user) => {
        if (cancelled) return;
        // 가입 완료 화면에선 자동 로그인 방지 — 세션만 확정하고 setAuth 는 보류.
        if (skipSetAuth) {
          useAuthStore.setState({ sessionResolved: true });
          return;
        }
        setAuth(user);
      })
      .catch(() => {
        if (cancelled) return;
        clearAuth();
      });

    return () => {
      cancelled = true;
    };
    // 로드당 1회 프로브 — pathname 변화(soft nav)로 재실행 불필요(세션은 이미 확정).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
