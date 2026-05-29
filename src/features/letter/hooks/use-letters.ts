'use client';

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { letterApi } from '@/features/letter/api/letter';
import { CACHE } from '@/lib/cache';
import type {
  Letter,
  LetterListKind,
  LetterPage,
} from '@/features/letter/types';

export const letterKeys = {
  all: ['letter'] as const,
  list: (kind: LetterListKind) => [...letterKeys.all, 'list', kind] as const,
  detail: (id: string) => [...letterKeys.all, 'detail', id] as const,
};

const FETCHERS: Record<
  LetterListKind,
  (cursor: number) => Promise<LetterPage>
> = {
  received: letterApi.listReceived,
  sent: letterApi.listSent,
  liked: letterApi.listLiked,
};

/**
 * 편지 목록 무한 스크롤 — 받은/보낸/좋아요(하트) 통합.
 * cursor 0 부터 시작 → nextCursor null 일 때까지.
 */
export function useLettersInfinite(kind: LetterListKind) {
  return useInfiniteQuery({
    queryKey: letterKeys.list(kind),
    queryFn: ({ pageParam = 0 }) => FETCHERS[kind](pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextCursor,
    ...(kind === 'received' ? CACHE.realtime : CACHE.user),
  });
}

export function useLetter(id: string) {
  return useQuery({
    queryKey: letterKeys.detail(id),
    queryFn: () => letterApi.get(id),
    enabled: !!id,
    ...CACHE.slow, // 단일 편지는 거의 변화 없음
  });
}

export function useSendLetter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: letterApi.send,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: letterKeys.list('sent') });
    },
  });
}

export function useToggleLikeLetter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: letterApi.toggleLike,
    onSuccess: (updated: Letter) => {
      qc.setQueryData(letterKeys.detail(updated.id), updated);
      qc.invalidateQueries({ queryKey: letterKeys.list('received') });
      qc.invalidateQueries({ queryKey: letterKeys.list('liked') });
    },
  });
}

export function useToggleSaveLetter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: letterApi.toggleSave,
    onSuccess: (updated: Letter) => {
      qc.setQueryData(letterKeys.detail(updated.id), updated);
      qc.invalidateQueries({ queryKey: letterKeys.list('received') });
    },
  });
}
