import { rankingControllerListV1 } from '@/api/generated/rankings/rankings';
import {
  quizControllerApplyV1,
  quizControllerGetMeV1,
  quizControllerGetQuizV1,
  quizControllerSubmitV1,
} from '@/api/generated/travel-types/travel-types';
import type { TravelTypeCode, TravelTypeDto } from '@/api/generated/schemas';
import { normalizeImageField } from '@/lib/secure-image-url';
import type {
  RankedDestination,
  RankingType,
  TravelTypeAnswer,
  TravelTypeQuiz,
} from '@/features/ranking/types';
import type { DestinationCategory } from '@/features/tournament/types';

/**
 * 랭킹 / 여행 유형 테스트 API — orval generated client wrap.
 *
 * 엔드포인트:
 *   GET   /rankings?type=&limit=        — RankItem[]
 *   GET   /travel-types/quiz            — 질문 목록 (public)
 *   POST  /travel-types/submit          — 응답 제출 → TravelTypeDto
 *   GET   /travel-types/me              — 내 결과 | null
 *   PATCH /travel-types/me              — 명시 적용 (code)
 */
export const rankingApi = {
  list: async (params: {
    type: RankingType;
    limit?: number;
    category?: DestinationCategory;
    season?: 'spring' | 'summer' | 'autumn' | 'winter';
    region?: string;
  }): Promise<RankedDestination[]> => {
    // generated Params 가 type/limit 만 (category/season/region 미정의). type 만 매핑.
    const res = await rankingControllerListV1({
      type: params.type,
      limit: params.limit != null ? String(params.limit) : undefined,
    });
    return (res as RankedDestination[]).map((r) => ({
      ...r,
      destination: normalizeImageField(r.destination),
    }));
  },

  getTravelTypeQuiz: () => quizControllerGetQuizV1() as Promise<TravelTypeQuiz>,

  submitTravelType: async (
    answers: TravelTypeAnswer[],
  ): Promise<TravelTypeDto> => {
    const res = await quizControllerSubmitV1({ answers });
    return normalizeTravelTypeImages(res as TravelTypeDto);
  },

  getMyTravelType: async (): Promise<TravelTypeDto | null> => {
    const res = (await quizControllerGetMeV1()) as TravelTypeDto | null;
    return res ? normalizeTravelTypeImages(res) : null;
  },

  setMyTravelType: async (code: TravelTypeCode): Promise<TravelTypeDto> => {
    const res = await quizControllerApplyV1({ code });
    return normalizeTravelTypeImages(res as TravelTypeDto);
  },
};

function normalizeTravelTypeImages(input: TravelTypeDto): TravelTypeDto {
  if (!input.recommended?.length) return input;
  return {
    ...input,
    recommended: input.recommended.map(normalizeImageField),
  };
}
