'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tournamentApi } from '@/features/tournament/api/tournament';
import { CACHE } from '@/lib/cache';
import type { TournamentConfig } from '@/features/tournament/types';

/**
 * Candidates query key — tournamentSize 는 일부러 제외.
 * 토너먼트 수가 Play 중에 결정되어도 destinations 풀은 그대로 유지(refetch 방지).
 * (tournamentSize 변경 시 시군 셔플이 다시 일어나 사용자 본 화면이 깨지지 않도록.)
 */
type CandidateKeyShape = Omit<TournamentConfig, 'tournamentSize'>;

export const tournamentKeys = {
  all: ['tournament'] as const,
  candidates: (config: CandidateKeyShape) =>
    [...tournamentKeys.all, 'candidates', config] as const,
  saved: () => [...tournamentKeys.all, 'saved'] as const,
  destinationDetail: (id: string) =>
    [...tournamentKeys.all, 'destination', id] as const,
};

/**
 * 설정에 맞는 후보 여행지 풀 조회
 * - /tournament/play 진입 직후 호출
 * - enabled: config 존재 시
 * - tournamentSize 는 fetchCandidates 가 받은 config 에서 query param 으로 전달되지만,
 *   query key 에는 포함하지 않음(같은 풀 유지).
 */
export function useTournamentCandidates(config: TournamentConfig | null) {
  return useQuery({
    queryKey: config
      ? tournamentKeys.candidates({
          theme: config.theme,
          categories: config.categories,
          count: config.count,
          region: config.region,
        })
      : ['tournament', 'candidates', 'idle'],
    queryFn: () => tournamentApi.fetchCandidates(config!),
    enabled: !!config,
    ...CACHE.session, // 한 세션 동안 고정 (Infinity + 1h gc)
  });
}

export function useSavedTournaments() {
  return useQuery({
    queryKey: tournamentKeys.saved(),
    queryFn: tournamentApi.listSaved,
    ...CACHE.user, // 본인 저장 목록
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

/**
 * 여행지 상세(풍부한 메타) — 우승자 화면 등에서 부가 정보 노출용.
 *
 * - id 유효할 때만 enabled
 * - CACHE.slow: 상세는 자주 안 바뀌므로 길게 (30min stale)
 * - 응답 필드 모두 optional → UI 는 있는 것만 렌더
 */
export function useDestinationDetail(id: string | undefined) {
  return useQuery({
    queryKey: id
      ? tournamentKeys.destinationDetail(id)
      : ['tournament', 'destination', 'idle'],
    queryFn: () => tournamentApi.getDestinationDetail(id!),
    enabled: !!id,
    ...CACHE.slow,
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
