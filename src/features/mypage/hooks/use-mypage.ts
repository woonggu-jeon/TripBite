'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mypageApi } from '@/features/mypage/api/mypage';
import { CACHE } from '@/lib/cache';
import { useAuthStore } from '@/stores/auth-store';
import type { UpdateProfileDto } from '@/api/generated/schemas';

export const mypageKeys = {
  all: ['mypage'] as const,
  summary: () => [...mypageKeys.all, 'summary'] as const,
  stamps: () => [...mypageKeys.all, 'stamps'] as const,
};

export function useMypage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: mypageKeys.summary(),
    queryFn: ({ signal }) => mypageApi.getSummary(signal),
    enabled: isAuthenticated,
    ...CACHE.user,
  });
}

export function useUpdateNickname() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProfileDto) => mypageApi.updateNickname(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mypageKeys.summary() });
      qc.invalidateQueries({ queryKey: ['auth', 'me'] }); // /me 응답도 닉네임 포함
    },
  });
}

export function useStamps() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: mypageKeys.stamps(),
    queryFn: ({ signal }) => mypageApi.getStamps(signal),
    enabled: isAuthenticated,
    ...CACHE.user,
  });
}

/**
 * 프로필 아바타 업로드 — multipart, onSuccess 시 /me + /mypage 캐시 갱신.
 * BE 응답의 avatarUrl 이 즉시 ProfileCard 에 반영되도록 invalidate.
 */
export function useUpdateAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => mypageApi.updateAvatar(file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auth', 'me'] });
      qc.invalidateQueries({ queryKey: mypageKeys.summary() });
    },
  });
}

/**
 * 프로필 아바타 제거 — DELETE /me/avatar. onSuccess 시 /me + /mypage 캐시 갱신.
 */
export function useRemoveAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => mypageApi.removeAvatar(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auth', 'me'] });
      qc.invalidateQueries({ queryKey: mypageKeys.summary() });
    },
  });
}
