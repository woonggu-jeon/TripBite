'use client';

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from '@tanstack/react-query';
import { letterApi } from '@/features/letter/api/letter';
import { CACHE } from '@/lib/cache';
import { useAuthStore } from '@/stores/auth-store';
import type {
  ComposeLetterDto,
  LetterDto,
  LetterPageDto,
} from '@/api/generated/schemas';
import type { LetterListKind } from '@/features/letter/types';

export const letterKeys = {
  all: ['letter'] as const,
  list: (kind: LetterListKind) => [...letterKeys.all, 'list', kind] as const,
  detail: (id: string) => [...letterKeys.all, 'detail', id] as const,
};

const FETCHERS: Record<
  LetterListKind,
  (cursor: number) => Promise<LetterPageDto>
> = {
  received: letterApi.listReceived,
  sent: letterApi.listSent,
  liked: letterApi.listLiked,
  saved: letterApi.listSaved,
};

/**
 * 편지 목록 무한 스크롤 — 받은/보낸/좋아요(하트) 통합.
 * cursor 0 부터 시작 → nextCursor null 일 때까지.
 */
export function useLettersInfinite(kind: LetterListKind) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useInfiniteQuery({
    queryKey: letterKeys.list(kind),
    queryFn: ({ pageParam = 0 }) => FETCHERS[kind](pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextCursor,
    enabled: isAuthenticated,
    ...(kind === 'received' ? CACHE.realtime : CACHE.user),
  });
}

/**
 * 목록 캐시에서 같은 편지를 찾아 상세의 초기 데이터로 쓴다.
 *
 * 목록에서 카드를 눌러 들어오면 이미 같은 LetterDto 를 갖고 있으므로, fetch 를
 * 기다리는 동안 빈 화면/잘못된 화면을 보여줄 이유가 없다. 특히 상세는
 * `isMine` 으로 화면 전체(제목·배치·액션)가 갈려서, 로딩 중 기본값으로 그리면
 * 보낸 편지를 눌렀는데 "도착한 편지" 가 잠깐 보이는 문제가 생긴다.
 */
function findCachedLetter(qc: QueryClient, id: string): LetterDto | undefined {
  const caches = qc.getQueriesData<InfiniteData<LetterPageDto>>({
    queryKey: [...letterKeys.all, 'list'],
  });
  for (const [, data] of caches) {
    for (const page of data?.pages ?? []) {
      const hit = page.items.find((l) => l.id === id);
      if (hit) return hit;
    }
  }
  return undefined;
}

export function useLetter(id: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const qc = useQueryClient();
  return useQuery({
    queryKey: letterKeys.detail(id),
    queryFn: () => letterApi.get(id),
    enabled: isAuthenticated && !!id,
    // 목록에서 진입한 경우 즉시 렌더 (깜빡임 0). 서버 응답이 오면 교체된다.
    placeholderData: () => findCachedLetter(qc, id),
    ...CACHE.slow, // 단일 편지는 거의 변화 없음
  });
}

export function useSendLetter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ComposeLetterDto) => letterApi.send(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: letterKeys.list('sent') });
    },
  });
}

/**
 * 좋아요 토글 — optimistic update + 에러 시 롤백.
 *
 * UX:
 *   - 호출자(LetterActions/LetterRowCard)가 로컬 state + debounce 로 빠른 연속 클릭 흡수.
 *   - 본 hook 의 onMutate 는 cache 를 즉시 토글 → 다른 화면에서 같은 letter 를 보고 있어도 즉시 반영.
 *   - 실패 시 onError 가 snapshot 으로 복원.
 *   - onSettled 에서 list 무효화 → 서버 진실 동기화.
 */
export function useToggleLikeLetter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => letterApi.toggleLike(id),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: letterKeys.detail(id) });
      const previous = qc.getQueryData<LetterDto>(letterKeys.detail(id));
      if (previous) {
        qc.setQueryData<LetterDto>(letterKeys.detail(id), {
          ...previous,
          liked: !previous.liked,
          likeCount:
            previous.likeCount !== undefined
              ? Math.max(0, previous.likeCount + (previous.liked ? -1 : 1))
              : previous.likeCount,
        });
      }
      return { previous };
    },
    onError: (_err, id, ctx) => {
      if (ctx?.previous) qc.setQueryData(letterKeys.detail(id), ctx.previous);
    },
    onSettled: (_data, _err, id) => {
      qc.invalidateQueries({ queryKey: letterKeys.detail(id) });
      qc.invalidateQueries({ queryKey: letterKeys.list('received') });
      qc.invalidateQueries({ queryKey: letterKeys.list('liked') });
    },
  });
}

export function useToggleSaveLetter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => letterApi.toggleSave(id),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: letterKeys.detail(id) });
      const previous = qc.getQueryData<LetterDto>(letterKeys.detail(id));
      if (previous) {
        qc.setQueryData<LetterDto>(letterKeys.detail(id), {
          ...previous,
          saved: !previous.saved,
        });
      }
      return { previous };
    },
    onError: (_err, id, ctx) => {
      if (ctx?.previous) qc.setQueryData(letterKeys.detail(id), ctx.previous);
    },
    onSettled: (_data, _err, id) => {
      qc.invalidateQueries({ queryKey: letterKeys.detail(id) });
      qc.invalidateQueries({ queryKey: letterKeys.list('received') });
      qc.invalidateQueries({ queryKey: letterKeys.list('saved') });
    },
  });
}

export function useDeleteLetter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => letterApi.remove(id),
    onSuccess: (_, id) => {
      qc.removeQueries({ queryKey: letterKeys.detail(id) });
      qc.invalidateQueries({ queryKey: letterKeys.list('received') });
      qc.invalidateQueries({ queryKey: letterKeys.list('sent') });
      qc.invalidateQueries({ queryKey: letterKeys.list('liked') });
      qc.invalidateQueries({ queryKey: letterKeys.list('saved') });
    },
  });
}
