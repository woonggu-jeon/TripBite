'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationInboxApi } from '@/features/notification/api/inbox';
import { useAuthStore } from '@/stores/auth-store';
import { CACHE } from '@/lib/cache';

export const notificationKeys = {
  all: ['notification'] as const,
  inbox: () => [...notificationKeys.all, 'inbox'] as const,
};

/**
 * 인박스 조회
 *
 * - 인증 상태에서만 fetch — 비로그인 시 enabled=false 로 query 정지.
 *   비로그인에서 fetch 시 401 → axios interceptor 의 /auth/refresh 시도 →
 *   실패 → clearAuth/toast/redirect 부작용. 그걸 원천 차단.
 * - 30초마다 자동 갱신 (윈도우 포커스 시에도)
 *   → 메뉴 사양 "정말 랜덤한 시간/장소에서 편지가 도착" 에 대응
 *   → 사용자 액티브 동안만 폴링 (background 탭은 React Query가 자동 정지)
 */
export function useNotificationInbox() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: notificationKeys.inbox(),
    queryFn: notificationInboxApi.get,
    ...CACHE.realtime, // 30s stale + 30s 폴링 (CACHE 일관)
    refetchOnWindowFocus: true,
    enabled: isAuthenticated,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationInboxApi.markRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.inbox() });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationInboxApi.markAllRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.inbox() });
    },
  });
}
