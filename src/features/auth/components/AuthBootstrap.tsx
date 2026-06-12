'use client';

import { useEffect } from 'react';
// 2026-06-12 — 보호 경로 redirect 책임을 middleware 로 이전.
// useRouter / usePathname / Route / PROTECTED_PATHS 회복 시 주석 복원.
// import { usePathname, useRouter } from 'next/navigation';
// import type { Route } from 'next';
import { useMe } from '@/features/auth/hooks/use-auth';
import { useAuthStore } from '@/stores/auth-store';

/**
 * AuthBootstrap — 인증 동기화 only.
 *
 * 책임:
 *   1) 앱 시작 시 GET /me → store 동기화 (persisted user 가 mount 즉시 hydrate)
 *   2) 401 → store clear (보호 경로 redirect 는 middleware + interceptor 가 담당)
 *
 * 인증 / Onboarding redirect 는 **middleware 책임** (SSR 단계). FOUC 0.
 * 401 hard redirect 안전망은 axios interceptor (services/interceptors/auth.ts).
 *
 * 렌더 X — 부수효과만.
 */

// const PROTECTED_PATHS = ['/mypage', '/settings', '/letter'];
//
// function isProtectedPath(pathname: string): boolean {
//   return PROTECTED_PATHS.some(
//     (p) => pathname === p || pathname.startsWith(`${p}/`),
//   );
// }

export function AuthBootstrap() {
  const { data, isSuccess, isError, isLoading } = useMe();
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  // const router = useRouter();
  // const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    if (isSuccess && data) {
      setAuth(data);
      return;
    }

    if (isError) {
      clearAuth();
      // 보호 경로 redirect 는 middleware (SSR) + interceptor (401 hard) 가 담당.
      // 클라 분기 회귀 회피 위해 본 분기 비활성. 회귀 시 주석 복원.
      //
      // if (isProtectedPath(pathname)) {
      //   const loginUrl = new URL('/login', window.location.origin);
      //   loginUrl.searchParams.set('redirect', pathname);
      //   router.replace((loginUrl.pathname + loginUrl.search) as Route);
      // }
    }
  }, [isLoading, isSuccess, isError, data, setAuth, clearAuth]);

  return null;
}
