'use client';

import {
  useInfiniteQuery,
  type QueryKey,
  type InfiniteData,
} from '@tanstack/react-query';
import { CACHE, type CacheProfile } from '@/lib/cache';

/**
 * 페이지네이션 응답 표준 형태
 *
 * 백엔드는 cursor 기반 또는 offset 기반 둘 다 가능.
 * nextCursor 가 null/undefined 이면 마지막 페이지.
 */
export type PageResponse<T> = {
  items: T[];
  nextCursor?: string | number | null;
};

type Options<T> = {
  queryKey: QueryKey;
  queryFn: (params: {
    pageParam?: string | number | null;
  }) => Promise<PageResponse<T>>;
  /** 캐시 프로파일 선택 (default: 'normal') */
  cache?: CacheProfile;
  enabled?: boolean;
};

/**
 * useInfiniteList — useInfiniteQuery 의 표준 래퍼
 *
 * 호출부:
 *   const { items, fetchNext, hasNext, isLoading } = useInfiniteList({
 *     queryKey: ['letters', 'received'],
 *     queryFn: ({ pageParam }) => letterApi.listReceivedPage({ cursor: pageParam }),
 *     cache: 'realtime',
 *   });
 *
 *   <InfiniteList items={items} hasNext={hasNext} onReachEnd={fetchNext}
 *      renderItem={(letter) => <LetterCard letter={letter} />} />
 */
export function useInfiniteList<T>({
  queryKey,
  queryFn,
  cache = 'normal',
  enabled = true,
}: Options<T>) {
  const profile = CACHE[cache];

  const query = useInfiniteQuery<
    PageResponse<T>,
    Error,
    InfiniteData<PageResponse<T>>,
    QueryKey,
    string | number | null
  >({
    queryKey,
    queryFn: ({ pageParam }) => queryFn({ pageParam }),
    initialPageParam: null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: profile.staleTime,
    gcTime: profile.gcTime,
    enabled,
  });

  const items = (query.data?.pages.flatMap((p) => p.items) ?? []) as T[];

  return {
    items,
    fetchNext: query.fetchNextPage,
    hasNext: query.hasNextPage,
    isLoading: query.isLoading,
    isFetchingNext: query.isFetchingNextPage,
    refetch: query.refetch,
    error: query.error,
  };
}
