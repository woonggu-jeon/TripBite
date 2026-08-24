'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';

/**
 * AuthGuard — 보호 경로 진입 시 비인증이면 즉시 paint 차단 + /login redirect.
 *
 * 회귀 사유 (3차 — 진단 확정 2026-06-12): SSR server snapshot 단계에서 zustand
 * store 의 isAuthenticated 가 initial false 로 render → React hydrate 시 첫
 * commit 후 useEffect 가 그 시점 **selector 의 캡처값 (false)** 으로 발동 →
 * `location.replace('/login')` 트리거. 직후 client snapshot 의 true 로 re-render
 * 되어 두 번째 effect run 은 OK paint 분기지만, 이미 navigation 시작 후.
 *
 * 진단 로그가 결정적이었음 — selector closure 의 isAuthenticated=false 와
 * `useAuthStore.getState()` 의 isAuthenticated=true 가 동일 effect 내에서 충돌.
 *
 * Fix — useEffect 안에서 closure 값 대신 `useAuthStore.getState()` 로 store 의
 * 최신 snapshot 직접 조회. SSR→CSR snapshot transition 무관하게 정합 보장.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [hasHydrated, setHasHydrated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return useAuthStore.persist.hasHydrated();
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (hasHydrated) return;
    const unsub = useAuthStore.persist.onFinishHydration(() =>
      setHasHydrated(true),
    );
    if (useAuthStore.persist.hasHydrated()) setHasHydrated(true);
    return unsub;
  }, [hasHydrated]);

  useEffect(() => {
    if (!hasHydrated) return;
    // selector closure 의 stale 값 (SSR server snapshot 잔재) 회피 —
    // 매 effect run 마다 store 의 최신 snapshot 직접 조회.
    const currentAuth = useAuthStore.getState().isAuthenticated;
    if (!currentAuth) {
      const loginUrl = new URL('/login', window.location.origin);
      loginUrl.searchParams.set(
        'redirect',
        window.location.pathname + window.location.search,
      );
      window.location.replace(loginUrl.toString());
      return;
    }
    setReady(true);
  }, [hasHydrated, isAuthenticated]);

  if (!ready) return null;
  return <>{children}</>;
}
