'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tournamentApi } from '@/features/tournament/api/tournament';
import type { TournamentConfig } from '@/features/tournament/types';

export const tournamentKeys = {
  all: ['tournament'] as const,
  candidates: (config: TournamentConfig) =>
    [...tournamentKeys.all, 'candidates', config] as const,
  saved: () => [...tournamentKeys.all, 'saved'] as const,
};

/**
 * 설정에 맞는 후보 여행지 N개 조회
 * - /tournament/play 페이즈 1 진입 직후 호출
 * - enabled 옵션으로 config 존재 시에만 fetch
 */
export function useTournamentCandidates(config: TournamentConfig | null) {
  return useQuery({
    queryKey: config ? tournamentKeys.candidates(config) : ['tournament', 'candidates', 'idle'],
    queryFn: () => tournamentApi.fetchCandidates(config!),
    enabled: !!config,
    staleTime: Infinity, // 토너먼트 1회 동안 고정
  });
}

export function useSavedTournaments() {
  return useQuery({
    queryKey: tournamentKeys.saved(),
    queryFn: tournamentApi.listSaved,
  });
}

export function useSaveTournament() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tournamentApi.saveToMypage,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tournamentKeys.saved() });
    },
  });
}

export function useRemoveSavedTournament() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tournamentApi.removeSaved,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tournamentKeys.saved() });
    },
  });
}
