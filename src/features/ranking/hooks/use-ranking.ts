'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { rankingApi } from '@/features/ranking/api/ranking';
import { CACHE } from '@/lib/cache';
import type { RankingType, TravelTypeAnswer } from '@/features/ranking/types';
import type { DestinationCategory } from '@/features/tournament/types';

export const rankingKeys = {
  all: ['ranking'] as const,
  list: (params: Record<string, unknown>) =>
    [...rankingKeys.all, 'list', params] as const,
  travelType: () => [...rankingKeys.all, 'travel-type'] as const,
  travelTypeQuiz: () => [...rankingKeys.all, 'travel-type', 'quiz'] as const,
};

export function useRanking(params: {
  type: RankingType;
  limit?: number;
  category?: DestinationCategory;
  season?: 'spring' | 'summer' | 'autumn' | 'winter';
  region?: string;
}) {
  return useQuery({
    queryKey: rankingKeys.list(params),
    queryFn: () => rankingApi.list(params),
    ...CACHE.normal, // 랭킹: 5min stale
  });
}

/** 홈 위젯용 */
export function useWeeklyTopDestinations(limit = 5) {
  return useRanking({ type: 'weekly-winners', limit });
}

export function useRecommendedDestinations(limit = 5) {
  return useRanking({ type: 'recommended', limit });
}

/** 여행 유형 테스트 — 질문은 거의 불변 */
export function useTravelTypeQuiz() {
  return useQuery({
    queryKey: rankingKeys.travelTypeQuiz(),
    queryFn: rankingApi.getTravelTypeQuiz,
    ...CACHE.static, // 1d stale + 7d gc
  });
}

export function useMyTravelType() {
  return useQuery({
    queryKey: rankingKeys.travelType(),
    queryFn: rankingApi.getMyTravelType,
    ...CACHE.user, // 본인 결과
  });
}

export function useSubmitTravelType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (answers: TravelTypeAnswer[]) =>
      rankingApi.submitTravelType(answers),
    onSuccess: (result) => {
      qc.setQueryData(rankingKeys.travelType(), result);
    },
  });
}
