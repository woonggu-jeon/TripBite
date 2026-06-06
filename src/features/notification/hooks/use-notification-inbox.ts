'use client';

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryKey,
} from '@tanstack/react-query';
import { notificationInboxApi } from '@/features/notification/api/inbox';
import { useAuthStore } from '@/stores/auth-store';
import { CACHE } from '@/lib/cache';
import type { NotificationInbox } from '@/features/notification/types';

export const notificationKeys = {
  all: ['notification'] as const,
  inbox: () => [...notificationKeys.all, 'inbox'] as const,
  badge: () => [...notificationKeys.all, 'badge'] as const,
};

/**
 * 인박스 페이지 조회 — `/notifications` 페이지가 사용.
 *
 * - cursor 기반 무한스크롤 (편지/시군콘텐츠와 동일 컨벤션).
 * - `unreadCount` 는 매 페이지 응답에 포함 — 첫 페이지의 unreadCount 가 badge source.
 * - 인증 사용자만. 비로그인 시 disabled.
 */
export function useNotificationInboxInfinite() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const profile = CACHE.realtime;
  const query = useInfiniteQuery<
    NotificationInbox,
    Error,
    InfiniteData<NotificationInbox>,
    QueryKey,
    number | string | null
  >({
    queryKey: notificationKeys.inbox(),
    queryFn: ({ pageParam }) =>
      notificationInboxApi.getPage({ cursor: pageParam, limit: 20 }),
    initialPageParam: null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: profile.staleTime,
    gcTime: profile.gcTime,
    refetchOnWindowFocus: true,
    enabled: isAuthenticated,
  });

  // BE swagger 의 AppNotificationType enum 명시로 generated 가 자동 narrowing.
  // cast 불필요. TYPE_ICON 미지원 type 은 NotificationsClient 의 `?? Bell` fallback.
  const items = query.data?.pages.flatMap((p) => p.items) ?? [];
  // 가장 최근 페이지의 unreadCount 사용 — markRead 시 invalidate 되며 갱신.
  const unreadCount = query.data?.pages[0]?.unreadCount ?? 0;

  return {
    items,
    unreadCount,
    fetchNext: query.fetchNextPage,
    hasNext: query.hasNextPage,
    isLoading: query.isLoading,
    isFetchingNext: query.isFetchingNextPage,
    refetch: query.refetch,
    error: query.error,
  };
}

/**
 * 헤더 badge 용 가벼운 조회 — unreadCount 만 필요.
 * 페이지 hook 과 같은 queryKey 사용 → 페이지 진입 후 추가 fetch 없음 (cache 공유).
 * 페이지 안 열린 사용자는 첫 페이지만 가져옴 — limit=1 로 작게.
 */
export function useNotificationBadge() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: notificationKeys.badge(),
    queryFn: () => notificationInboxApi.getPage({ limit: 1 }),
    ...CACHE.realtime,
    refetchOnWindowFocus: true,
    enabled: isAuthenticated,
    select: (data) => data.unreadCount,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationInboxApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationInboxApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
