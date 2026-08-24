'use client';

import { useAuthStore } from '@/stores/auth-store';

/**
 * 유저 스코프 쿼리 `enabled` 게이트 — 세션 프로브(/me) 확정 후에만 true.
 *
 * `isAuthenticated` 단독 게이팅의 문제 (2026-08-10): localStorage 에 persist 된
 * 낙관 인증값이 재방문 시 stale-true 로 남아, 실제 세션이 만료됐어도 유저 스코프
 * 쿼리(헤더 배지 /notifications/unread-count 등)가 곧바로 발사 → 403 + 스퓨리어스
 * '세션 만료' 토스트. AuthBootstrap 의 /me 프로브가 세션을 확정(setAuth/clearAuth)
 * 하기 전까지 폴링을 막아 로드타임에 authed 요청은 /me 하나만 나가게 한다.
 *
 * 사용: `enabled: useAuthedQueryEnabled()` (조건 추가 시 `&& !!id` 등으로 결합).
 * 세션 확정은 로드당 1회(AuthBootstrap) — 이후 soft nav 에선 이미 true 라 지연 없음.
 */
export function useAuthedQueryEnabled(): boolean {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const sessionResolved = useAuthStore((s) => s.sessionResolved);
  return isAuthenticated && sessionResolved;
}
