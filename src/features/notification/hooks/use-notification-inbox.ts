'use client';

import {
  type InfiniteData,
  type QueryKey,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { NotificationListDto } from '@/api/generated/schemas';
import { notificationInboxApi } from '@/features/notification/api/inbox';
import { CACHE } from '@/lib/cache';
import { useAuthStore } from '@/stores/auth-store';

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
    NotificationListDto,
    Error,
    InfiniteData<NotificationListDto>,
    QueryKey,
    number | string | null
  >({
    queryKey: notificationKeys.inbox(),
    queryFn: ({ pageParam }) =>
      notificationInboxApi.getPage({ cursor: pageParam, limit: 20 }),
    initialPageParam: null,
    // null 만 undefined 변환 (cursor 0 같은 valid cursor 보존). 2026-06-19 audit.
    getNextPageParam: (last) =>
      last.nextCursor === null ? undefined : last.nextCursor,
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
 * 헤더 badge 용 경량 조회 — `/notifications/unread-count` 단독 endpoint.
 * 인박스 전체 fetch 없이 unreadCount 만 받음 (응답 ~50 bytes).
 * 페이지 hook (`useNotificationInboxInfinite`) 과 별도 queryKey — 두 hook 의 invalidate 동시 갱신.
 */
export function useNotificationBadge() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: notificationKeys.badge(),
    queryFn: () => notificationInboxApi.unreadCount(),
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
