'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth-store';

/**
 * AuthGuard — 보호 경로 진입 시 비인증이면 즉시 paint 차단 + /login redirect.
 *
 * 회귀 사유 (재발): 첫 회귀는 `/me` fetch 응답 전 paint 됨 (FOUC) → mount 즉시
 * isAuthenticated 검사로 해결. 그런데 hard navigation (window.location.assign)
 * 후 진입 시 **zustand persist 의 client hydration 이 완료되기 전** 에 useEffect
 * 가 SSR 초기값 `isAuthenticated=false` 를 보고 즉시 location.replace → 로그인
 * 성공한 사용자도 /login 으로 풀리는 증상. cookie 와 무관 — 클라 hydration 타이밍.
 *
 * Fix — persist hydration 완료 후에만 인증 판정:
 *   - `useAuthStore.persist.hasHydrated()` flag 가 true 일 때까지 대기
 *   - onFinishHydration subscription 으로 비동기 케이스도 커버
 *
 * 동작:
 *   - hydration 전 → null (paint 0, redirect 0)
 *   - hydration 후 isAuthenticated=false → location.replace('/login?redirect=...')
 *   - hydration 후 isAuthenticated=true → children paint
 *
 * 안전망: AuthBootstrap 의 `/me` 401 → /login redirect 은 그대로 유지 — cached
 * stale (cookie 만료, 다른 기기 로그아웃) 케이스 대응.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [hasHydrated, setHasHydrated] = useState<boolean>(() => {
    // SSR 에선 false, CSR mount 시점엔 이미 hydrated 인 경우가 많음 (localStorage sync).
    if (typeof window === 'undefined') return false;
    return useAuthStore.persist.hasHydrated();
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (hasHydrated) return;
    const unsub = useAuthStore.persist.onFinishHydration(() =>
      setHasHydrated(true),
    );
    // 구독 직후에도 한 번 더 체크 — subscribe 와 hydration 완료 사이의 race 대응.
    if (useAuthStore.persist.hasHydrated()) setHasHydrated(true);
    return unsub;
  }, [hasHydrated]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) {
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
