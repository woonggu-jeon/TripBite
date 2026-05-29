'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useMe } from '@/features/auth/hooks/use-auth';
import { useAuthStore } from '@/stores/auth-store';

/**
 * AuthBootstrap (사이트맵 v2)
 *
 * 책임:
 *   1) 앱 시작 시 GET /me 호출 → store 동기화
 *   2) 인증 + onboarding 미완료 사용자가 (main) 라우트에 진입 → /onboarding 으로 redirect
 *   3) 인증 + onboarding 완료 사용자가 /onboarding 진입 → / 로 redirect
 *
 * middleware 와 분리한 이유:
 *   - middleware 는 쿠키만 보고 API 호출 불가
 *   - onboarding 완료 여부는 /me 응답의 필드라서 client에서 결정해야 함
 *
 * 렌더 X — 부수효과만.
 */
export function AuthBootstrap() {
  const { data, isSuccess, isError } = useMe();
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isSuccess && data) {
      setAuth(data);

      // 첫 진입 시 onboarding redirect — /me 의 isOnboarded false 면 /onboarding 으로.
      // mock 환경(NEXT_PUBLIC_USE_MSW=true) 에서 onboardedState 초기값 false 라
      // 새로 방문한 사용자가 자동으로 온보딩부터 보게 됨.
      const isOnboarded =
        (data as { isOnboarded?: boolean }).isOnboarded ?? true;
      if (!isOnboarded && pathname !== '/onboarding') {
        router.replace('/onboarding');
      } else if (isOnboarded && pathname === '/onboarding') {
        router.replace('/');
      }
    } else if (isError) {
      clearAuth();
    }
  }, [isSuccess, isError, data, setAuth, clearAuth, router, pathname]);

  return null;
}
