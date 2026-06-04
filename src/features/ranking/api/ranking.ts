import { api } from '@/services/api/client';
import { safeParseResponse } from '@/lib/safe-parse-response';
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
    return safeParseResponse(
      rankingListSchema,
      res.data,
      `GET /rankings ${params.type}`,
    ) as RankedDestination[];
  },

  getTravelTypeQuiz: async (): Promise<TravelTypeQuiz> => {
    const res = await api.get<TravelTypeQuiz>('/travel-types/quiz');
    return res.data;
  },

  submitTravelType: async (
    answers: TravelTypeAnswer[],
  ): Promise<TravelType> => {
    const res = await api.post<unknown>('/travel-types/submit', { answers });
    return safeParseResponse(
      travelTypeSchema,
      res.data,
      'POST /travel-types/submit',
    ) as TravelType;
  },

  getMyTravelType: async (): Promise<TravelType | null> => {
    const res = await api.get<unknown>('/travel-types/me');
    return safeParseResponse(
      myTravelTypeSchema,
      res.data,
      'GET /travel-types/me',
    ) as TravelType | null;
  },

  /**
   * 내 유형 설정/변경 — quiz 결과 외에 사용자가 명시 선택해 프로필에 적용.
   * PATCH /travel-types/me { code }
   */
  setMyTravelType: async (code: string): Promise<TravelType> => {
    const res = await api.patch<unknown>('/travel-types/me', { code });
    return safeParseResponse(
      travelTypeSchema,
      res.data,
      'PATCH /travel-types/me',
    ) as TravelType;
  },
};
