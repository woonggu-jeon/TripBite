'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationInboxApi } from '@/features/notification/api/inbox';

export const notificationKeys = {
  all: ['notification'] as const,
  inbox: () => [...notificationKeys.all, 'inbox'] as const,
};

/**
 * 인박스 조회
 *
 * - 30초마다 자동 갱신 (윈도우 포커스 시에도)
 *   → 메뉴 사양 "정말 랜덤한 시간/장소에서 편지가 도착" 에 대응
 *   → 사용자 액티브 동안만 폴링 (background 탭은 React Query가 자동 정지)
 */
export function useNotificationInbox() {
  return useQuery({
    queryKey: notificationKeys.inbox(),
    queryFn: notificationInboxApi.get,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    // 미로그인 사용자에선 ProvidersTree가 마운트되지만 401이 떨어지면
    // 자동 retry 후 미인증으로 간주 — useMe 와 같은 패턴으로 처리됨.
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
