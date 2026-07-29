'use client';

import { type ReactNode } from 'react';

// 2026-06-12 — 인증 redirect 를 middleware (SSR 단계) 로 이전.
// 클라 가드 (AuthGuard) 는 hydration race 회귀가 반복되어 비활성화.
// 안 되면 빠른 원복을 위해 주석 보존.
//
// import { usePathname } from 'next/navigation';
// import { AuthGuard } from '@/features/auth/components/AuthGuard';
//
// const PROTECTED_PATHS = ['/mypage', '/settings', '/letter', '/notifications'];
//
// function isProtectedPath(pathname: string): boolean {
//   return PROTECTED_PATHS.some(
//     (p) => pathname === p || pathname.startsWith(`${p}/`),
//   );
// }

/**
 * (main) 그룹 내 보호 경로 래퍼 — 현재 pass-through.
 *
 * 인증 redirect 는 middleware.ts 가 SSR 단계에서 처리:
 *   - 보호 경로 + SID cookie 없음 → /login?redirect=... (302)
 *   - paint 0 (서버 단계 redirect)
 *
 * 만료 SID 케이스 안전망: axios interceptor (auth.ts) 의 401 hard redirect.
 *
 * 회귀 시 원복 — 위 import / isProtectedPath / AuthGuard wrap 주석 복원 + 본
 * 함수에서 다시 분기.
 */
export function ProtectedScope({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
