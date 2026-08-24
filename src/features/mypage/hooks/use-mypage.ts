'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authKeys } from '@/features/auth/hooks/use-auth';
import { useAuthedQueryEnabled } from '@/features/auth/hooks/use-authed-query';
import { mypageApi } from '@/features/mypage/api/mypage';
import { CACHE } from '@/lib/cache';
import type { MypageSummaryDto, UpdateProfileDto } from '@/types/api-domain';

export const mypageKeys = {
  all: ['mypage'] as const,
  summary: () => [...mypageKeys.all, 'summary'] as const,
  stamps: () => [...mypageKeys.all, 'stamps'] as const,
};

export function useMypage() {
  const enabled = useAuthedQueryEnabled();
  return useQuery({
    queryKey: mypageKeys.summary(),
    queryFn: ({ signal }) => mypageApi.getSummary(signal),
    enabled,
    ...CACHE.user,
  });
}

/**
 * 닉네임 변경 — optimistic update + onError rollback.
 *
 * 2026-06-19 audit: onSuccess invalidate 만 있으면 사용자가 서버 응답까지
 * 기다림. onMutate 로 mypage summary cache 의 nickname 즉시 갱신 → UX 향상.
 * 실패 시 onError 가 snapshot 복원 + onSuccess 가 /me 서버 truth 동기화.
 */
export function useUpdateNickname() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProfileDto) => mypageApi.updateNickname(data),
    onMutate: async (newData) => {
      await qc.cancelQueries({ queryKey: mypageKeys.summary() });
      const previous = qc.getQueryData<MypageSummaryDto>(mypageKeys.summary());
      if (previous && newData.nickname) {
        qc.setQueryData<MypageSummaryDto>(mypageKeys.summary(), {
          ...previous,
          profile: { ...previous.profile, nickname: newData.nickname },
        });
      }
      return { previous };
    },
    onError: (_err, _data, context) => {
      if (context?.previous) {
        qc.setQueryData(mypageKeys.summary(), context.previous);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mypageKeys.summary() });
      qc.invalidateQueries({ queryKey: authKeys.me() }); // /me 응답도 닉네임 포함
    },
  });
}

export function useStamps() {
  const enabled = useAuthedQueryEnabled();
  return useQuery({
    queryKey: mypageKeys.stamps(),
    queryFn: ({ signal }) => mypageApi.getStamps(signal),
    enabled,
    ...CACHE.user,
  });
}

/**
 * 프로필 이미지 업로드 — POST /me/avatar (multipart).
 * onSuccess 시 /me + /mypage summary invalidate → 서버 avatarUrl 이 정식 source.
 */
export function useUpdateAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => mypageApi.updateAvatar(file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: authKeys.me() });
      qc.invalidateQueries({ queryKey: mypageKeys.summary() });
    },
  });
}

/** 프로필 이미지 삭제 — DELETE /me/avatar → 기본 아바타로 복귀. */
export function useRemoveAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => mypageApi.removeAvatar(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: authKeys.me() });
      qc.invalidateQueries({ queryKey: mypageKeys.summary() });
    },
  });
}
