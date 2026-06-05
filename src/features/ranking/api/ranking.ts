import { api } from '@/services/api/client';
import { safeParseResponse } from '@/lib/safe-parse-response';
import { normalizeImageField } from '@/lib/secure-image-url';
import {
  rankingListSchema,
  myTravelTypeSchema,
} from '@/features/ranking/schemas/ranking';
import { travelTypeSchema } from '@/features/mypage/schemas/mypage';
import type {
  RankedDestination,
  RankingType,
  TravelType,
  TravelTypeAnswer,
  TravelTypeQuiz,
} from '@/features/ranking/types';
import type { DestinationCategory } from '@/features/tournament/types';

/**
 * 랭킹 / 여행 유형 테스트 API
 *
 * 엔드포인트 예시:
 *   GET  /rankings?type=weekly-winners&limit=5
 *   GET  /rankings?type=recommended&limit=5
 *   GET  /rankings?type=by-category&category=festival&limit=5
 *   GET  /rankings?type=seasonal&season=spring
 *   GET  /rankings?type=by-travel-type
 *   GET  /rankings?type=by-region&region=청주시
 *   GET  /travel-types/quiz                  — 질문 목록
 *   POST /travel-types/submit                — 응답 제출 → 결과 반환 + 저장
 *   GET  /travel-types/me                    — 내 결과
 */
export const rankingApi = {
  list: async (params: {
    type: RankingType;
    limit?: number;
    category?: DestinationCategory;
    season?: 'spring' | 'summer' | 'autumn' | 'winter';
    region?: string;
  }): Promise<RankedDestination[]> => {
    const res = await api.get<unknown>('/rankings', { params });
    const parsed = safeParseResponse(
      rankingListSchema,
      res.data,
      `GET /rankings ${params.type}`,
    ) as RankedDestination[];
    // destination.imageUrl 의 http → https 정규화 (TourAPI 원본 안전망)
    return parsed.map((r) => ({
      ...r,
      destination: normalizeImageField(r.destination),
    }));
  },

  getTravelTypeQuiz: async (): Promise<TravelTypeQuiz> => {
    const res = await api.get<TravelTypeQuiz>('/travel-types/quiz');
    return res.data;
  },

  submitTravelType: async (
    answers: TravelTypeAnswer[],
  ): Promise<TravelType> => {
    const res = await api.post<unknown>('/travel-types/submit', { answers });
    const parsed = safeParseResponse(
      travelTypeSchema,
      res.data,
      'POST /travel-types/submit',
    ) as TravelType;
    return normalizeTravelTypeImages(parsed);
  },

  getMyTravelType: async (): Promise<TravelType | null> => {
    const res = await api.get<unknown>('/travel-types/me');
    const parsed = safeParseResponse(
      myTravelTypeSchema,
      res.data,
      'GET /travel-types/me',
    ) as TravelType | null;
    return parsed ? normalizeTravelTypeImages(parsed) : null;
  },

  /**
   * 내 유형 설정/변경 — quiz 결과 외에 사용자가 명시 선택해 프로필에 적용.
   * PATCH /travel-types/me { code }
   */
  setMyTravelType: async (code: string): Promise<TravelType> => {
    const res = await api.patch<unknown>('/travel-types/me', { code });
    const parsed = safeParseResponse(
      travelTypeSchema,
      res.data,
      'PATCH /travel-types/me',
    ) as TravelType;
    return normalizeTravelTypeImages(parsed);
  },
};

/**
 * TravelType.recommended[].imageUrl 의 http → https 정규화 (TourAPI 안전망).
 */
function normalizeTravelTypeImages(input: TravelType): TravelType {
  if (!input.recommended?.length) return input;
  return {
    ...input,
    recommended: input.recommended.map(normalizeImageField),
  };
}
