'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import type { Route } from 'next';
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

// middleware 와 동일 — mock 환경 (USE_MSW=true) 에선 middleware redirect 가 skip 되므로
// 미인증 + 보호 경로 진입 시 클라이언트에서 동일한 redirect 를 적용해야 한다.
// 운영에선 middleware 가 먼저 막아 이 경로 진입 자체가 없음 — 안전망 역할.
const PROTECTED_PATHS = ['/mypage', '/settings', '/letter'];

// onboarding 자동 redirect 를 적용하지 않는 경로 — auth/정책/오프라인 + onboarding 자체.
// 무한 루프 회피: /onboarding 안에서 /onboarding 으로 또 redirect 하지 않도록.
const SKIP_ONBOARDING_REDIRECT_PATHS = [
  '/onboarding',
  '/login',
  '/signup',
  '/find-id',
  '/forgot-password',
  '/reset-password',
  '/policy',
  '/offline',
];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

function shouldSkipOnboardingRedirect(pathname: string): boolean {
  return SKIP_ONBOARDING_REDIRECT_PATHS.some(
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

      // onboarded 판정 — backend 와 localStorage 의 OR.
      //
      // 이유: mock SW 메모리(onboardedState) 가 페이지 reload 마다 false 로
      // 리셋되어 매번 onboarding 으로 redirect 되는 회귀 발생. 실 백엔드 환경에서도
      // 일시 장애 / DB 롤백 등으로 isOnboarded 가 false 로 와도 디바이스에서 한번
      // 완료한 사용자에게 다시 노출하지 않는 게 UX 일관.
      // - localStorage true (디바이스 신호) ─ 한번 완료 → 다시 노출 X
      // - backend true                     ─ 정상 완료 상태
      // - 둘 다 false                       ─ redirect 대상
      // 명시 reset 이 필요한 경우 localStorage 도 함께 비워야 함 (개발 도구 등).
      const backendOnboarded =
        (data as { isOnboarded?: boolean }).isOnboarded ?? true;
      const localOnboarded = localOnboarding.read();
      const isOnboarded = backendOnboarded || localOnboarded;

      if (!isOnboarded && pathname !== '/onboarding') {
        router.replace('/onboarding');
      } else if (isOnboarded && pathname === '/onboarding') {
        // 다음 방문/디바이스 신호 일관 위해 localStorage 도 sync.
        if (!localOnboarded) localOnboarding.write(true);
        router.replace('/');
      }
      return;
    }

    if (isError) {
      clearAuth();
    }

    // 비인증 + 보호 경로 진입 → 로그인 페이지로 (mock 환경의 middleware skip 안전망).
    // redirect 값은 plain pathname — URLSearchParams 가 자동 encode. middleware 와 일관.
    // (이전: encodeURIComponent 사용 → URL 에 다시 query encode 가 적용되어 double-encode
    //  → LoginForm 의 `startsWith('/')` 체크 실패 → returnUrl 누락 회귀.)
    if (isError && isProtectedPath(pathname)) {
      const loginUrl = new URL('/login', window.location.origin);
      loginUrl.searchParams.set('redirect', pathname);
      router.replace((loginUrl.pathname + loginUrl.search) as Route);
      return;
    }

    // 비인증 + public 경로 + 첫 방문 (localStorage 미설정) → /onboarding 자동 진입.
    // SKIP_ONBOARDING_REDIRECT_PATHS 에 포함된 경로 (auth / policy / onboarding
    // 자체 등) 는 skip — 무한 루프 회피.
    if (!shouldSkipOnboardingRedirect(pathname) && !localOnboarding.read()) {
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
