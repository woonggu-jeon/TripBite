'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useMe } from '@/features/auth/hooks/use-auth';
import { useAuthStore } from '@/stores/auth-store';

/**
 * AuthBootstrap — 인증 동기화 only.
 *
 * 책임:
 *   1) 앱 시작 시 GET /me → store 동기화 (persisted user 가 mount 즉시 hydrate)
 *   2) 401 → store clear + 보호 경로면 /login?redirect=...
 *
 * Onboarding redirect 는 **middleware 책임** (`tripbite.visited` cookie 기반 SSR 단계).
 * FOUC 회피 + cross-origin 인증 흐름과 분리.
 *
 * 렌더 X — 부수효과만.
 */

const PROTECTED_PATHS = ['/mypage', '/settings', '/letter'];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function AuthBootstrap() {
  const { data, isSuccess, isError, isLoading } = useMe();
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    if (isSuccess && data) {
      setAuth(data);
      return;
    }

    if (isError) {
      clearAuth();
      // 보호 경로 + 미인증 → /login. middleware 가 cross-origin cookie 못 봐서 client 안전망.
      if (isProtectedPath(pathname)) {
        const loginUrl = new URL('/login', window.location.origin);
        loginUrl.searchParams.set('redirect', pathname);
        router.replace((loginUrl.pathname + loginUrl.search) as Route);
      }
    }
  }, [
    isLoading,
    isSuccess,
    isError,
    data,
    setAuth,
    clearAuth,
    router,
    pathname,
  ]);

  return null;
}
