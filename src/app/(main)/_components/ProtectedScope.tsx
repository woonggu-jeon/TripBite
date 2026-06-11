'use client';

import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';
import { AuthGuard } from '@/features/auth/components/AuthGuard';

/**
 * (main) 그룹 내 보호 경로만 AuthGuard 로 감싸는 path-aware wrapper.
 *
 * 보호 경로 (인증 필요) 진입 시 비인증이면 즉시 paint 차단 + /login redirect.
 * 다른 경로 (홈/시군/destination/tournament 등 public) 은 그대로 진입.
 *
 * 사용처 — `(main)/layout.tsx` 의 children wrap. 모든 보호 page 에 일관 적용.
 */
const PROTECTED_PATHS = ['/mypage', '/settings', '/letter', '/notifications'];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function ProtectedScope({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (isProtectedPath(pathname)) {
    return <AuthGuard>{children}</AuthGuard>;
  }
  return <>{children}</>;
}
