'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth-store';

/**
 * AuthGuard — 보호 경로 진입 시 비인증이면 즉시 paint 차단 + /login redirect.
 *
 * 회귀 사유: AuthBootstrap 의 useEffect 가 `/me` fetch 응답 후에야 동작 →
 * 그 사이 mypage 등이 잠깐 paint 됨 (FOUC). zustand persist 의 cached user 를
 * mount 즉시 (render 가드) 확인하면 paint 자체를 막을 수 있음.
 *
 * 동작:
 *   - persist hydration 끝나기 전 (`ready=false`) → null (paint 0)
 *   - hydration 후 isAuthenticated=false → window.location.replace('/login?redirect=...')
 *     + null 유지 (사용자가 잘못된 페이지 paint 안 봄)
 *   - hydration 후 isAuthenticated=true → children paint
 *
 * 안전망: AuthBootstrap 의 `/me` 401 → /login redirect 은 그대로 유지 — cached
 * stale (cookie 만료, 다른 기기 로그아웃) 케이스 대응.
 *
 * 사용:
 *   // app/(main)/mypage/page.tsx
 *   export default function MyPage() {
 *     return <AuthGuard><MyPageClient /></AuthGuard>;
 *   }
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // mount 시점엔 zustand persist 의 localStorage 복원 완료.
    // false → hard navigation (middleware 가 새 요청에서 cookie 정합 검증).
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
  }, [isAuthenticated]);

  if (!ready) return null;
  return <>{children}</>;
}
