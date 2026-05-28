'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { letterApi } from '@/features/letter/api/letter';
import { CACHE } from '@/lib/cache';
import type { Letter } from '@/features/letter/types';

export const letterKeys = {
  all: ['letter'] as const,
  received: () => [...letterKeys.all, 'received'] as const,
  sent: () => [...letterKeys.all, 'sent'] as const,
  detail: (id: string) => [...letterKeys.all, 'detail', id] as const,
};

export function useReceivedLetters() {
  return useQuery({
    queryKey: letterKeys.received(),
    queryFn: letterApi.listReceived,
    ...CACHE.realtime, // 편지 도착 — 30s + 폴링
  });
}

export function useSentLetters() {
  return useQuery({
    queryKey: letterKeys.sent(),
    queryFn: letterApi.listSent,
    ...CACHE.user, // 본인 데이터
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
      qc.invalidateQueries({ queryKey: letterKeys.sent() });
    },
  });
}

export function useToggleLikeLetter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: letterApi.toggleLike,
    onSuccess: (updated: Letter) => {
      qc.setQueryData(letterKeys.detail(updated.id), updated);
      qc.invalidateQueries({ queryKey: letterKeys.received() });
    },
  });
}

export function useToggleSaveLetter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: letterApi.toggleSave,
    onSuccess: (updated: Letter) => {
      qc.setQueryData(letterKeys.detail(updated.id), updated);
      qc.invalidateQueries({ queryKey: letterKeys.received() });
    },
  });
}
