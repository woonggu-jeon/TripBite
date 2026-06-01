'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useMe } from '@/features/auth/hooks/use-auth';
import { useAuthStore } from '@/stores/auth-store';
import { localOnboarding } from '@/features/onboarding/hooks/use-local-onboarding';

/**
 * AuthBootstrap (사이트맵 v2)
 *
 * 책임:
 *   1) 앱 시작 시 GET /me 호출 → store 동기화
 *   2) onboarding redirect (두 경로):
 *      - 인증 사용자: /me 의 isOnboarded false → /onboarding (백엔드 우선)
 *      - 비인증 사용자: localStorage 의 tripbite.onboarded 미존재 → /onboarding
 *        (로그인 전에도 앱 소개 + 위치 권한 안내가 노출되도록)
 *   3) onboarding 완료 사용자가 /onboarding 진입 → / 로 redirect
 *
 * middleware 와 분리한 이유:
 *   - middleware 는 쿠키만 보고 API 호출 불가
 *   - onboarding 완료 여부는 /me 응답 (인증) 또는 localStorage (비인증) 에서 결정
 *
 * 렌더 X — 부수효과만.
 */

// onboarding redirect 를 적용하지 않는 경로 — auth 페이지, 정책 페이지 등.
const SKIP_REDIRECT_PATHS = [
  '/onboarding',
  '/login',
  '/signup',
  '/find-id',
  '/forgot-password',
  '/reset-password',
  '/policy',
  '/offline',
];

function shouldSkipRedirect(pathname: string): boolean {
  return SKIP_REDIRECT_PATHS.some(
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
    // me 응답 대기 중에는 판정 보류 (인증 여부 미확정)
    if (isLoading) return;

    if (isSuccess && data) {
      setAuth(data);

      // 인증 사용자: 백엔드 isOnboarded 우선
      const isOnboarded =
        (data as { isOnboarded?: boolean }).isOnboarded ?? true;
      if (!isOnboarded && pathname !== '/onboarding') {
        router.replace('/onboarding');
      } else if (isOnboarded && pathname === '/onboarding') {
        // 인증 + 완료 상태는 localStorage 도 sync (다음 방문 시 비인증 검사 통과)
        localOnboarding.write(true);
        router.replace('/');
      }
      return;
    }

    if (isError) {
      clearAuth();
    }

    // 비인증 (isError 또는 me 호출 안 됨) — localStorage 기반 redirect
    if (!shouldSkipRedirect(pathname) && !localOnboarding.read()) {
      router.replace('/onboarding');
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
