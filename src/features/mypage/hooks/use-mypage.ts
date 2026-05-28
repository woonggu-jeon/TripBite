'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mypageApi } from '@/features/mypage/api/mypage';
import { CACHE } from '@/lib/cache';
import type { UpdateNicknameRequest } from '@/features/mypage/types';

export const mypageKeys = {
  all: ['mypage'] as const,
  summary: () => [...mypageKeys.all, 'summary'] as const,
};

export function useMypage() {
  return useQuery({
    queryKey: mypageKeys.summary(),
    queryFn: mypageApi.getSummary,
    ...CACHE.user, // 사용자 데이터 (2min)
  });
}

export function useUpdateNickname() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateNicknameRequest) => mypageApi.updateNickname(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mypageKeys.summary() });
      qc.invalidateQueries({ queryKey: ['auth', 'me'] }); // /me 응답도 닉네임 포함
    },
  });
}
