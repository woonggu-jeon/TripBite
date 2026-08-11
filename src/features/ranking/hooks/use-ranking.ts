'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthedQueryEnabled } from '@/features/auth/hooks/use-authed-query';
import { mypageKeys } from '@/features/mypage/hooks/use-mypage';
import { rankingApi } from '@/features/ranking/api/ranking';
import type { RankingType, TravelTypeAnswer } from '@/features/ranking/types';
import { CACHE } from '@/lib/cache';
import type { DestinationCategory } from '@/types/api-domain';
import type { TravelTypeCode } from '@/types/api-domain';

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

export function useRecommendedDestinations(
  limit = 5,
  category?: DestinationCategory,
) {
  return useRanking({ type: 'recommended', limit, category });
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
  const enabled = useAuthedQueryEnabled();
  return useQuery({
    queryKey: rankingKeys.travelType(),
    queryFn: rankingApi.getMyTravelType,
    enabled,
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

/**
 * 내 유형 명시 설정 — quiz 결과 페이지의 "내 유형으로 적용" 액션.
 *
 * BE spec: PATCH /travel-types/me 응답은 TravelTypeDto (recommended: []) — 저장 ack.
 * recommended 는 GET /travel-types/me 가 빌드. 따라서 setQueryData 대신 invalidate
 * → 다음 useMyTravelType refetch 가 recommended 포함 데이터 반환 → 결과 화면의
 * "이런 여행지가 어울려요" 영역 유지.
 *
 * `useMypage` 의 summary 도 invalidate — 마이페이지 프로필 카드 즉시 반영.
 */
export function useSetMyTravelType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: TravelTypeCode) => rankingApi.setMyTravelType(code),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rankingKeys.travelType() });
      // mypage summary 응답에 travelType 포함 → 갱신 필요. raw array 대신
      // mypageKeys.summary() 사용 — 신규 keys 변경 시 자동 추적.
      qc.invalidateQueries({ queryKey: mypageKeys.summary() });
    },
  });
}
