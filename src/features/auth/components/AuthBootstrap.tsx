'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
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
 * `/signup/complete` 예외 (2026-06-19):
 *   가입 직후 BE SID cookie 가 박혀 useMe → setAuth 자동 호출이 "자동 로그인"
 *   효과를 일으킴. 사용자 요청에 따라 가입 ≠ 로그인 흐름 분리 — 본 페이지에서는
 *   setAuth skip. SignupCompleteView 의 시작하기 클릭 시 명시적 setAuth.
 *
 * 렌더 X — 부수효과만.
 */

const SETAUTH_SKIP_PATHS = ['/signup/complete'];

export function AuthBootstrap() {
  const { data, isSuccess, isError, isLoading } = useMe();
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const pathname = usePathname();
  const skipSetAuth = SETAUTH_SKIP_PATHS.includes(pathname);

  useEffect(() => {
    if (isLoading) return;

    if (isSuccess && data) {
      if (skipSetAuth) return;
      setAuth(data);
      return;
    }

    if (isError) {
      clearAuth();
    }
  }, [isLoading, isSuccess, isError, data, setAuth, clearAuth, skipSetAuth]);

  return null;
}
