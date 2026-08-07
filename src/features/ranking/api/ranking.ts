// 신규 Spring BE 지원: 주간 top / 시군별 우승수 (그 외 랭킹 타입은 미지원 → 구 generated mock 유지)
import {
  getRegionRankings,
  getWeeklyTopDestinations,
} from '@/api/be/tournament/tournament';
// 신규 Spring BE 지원: quiz(GET) + submit(POST). (me GET/PATCH 는 미지원 → 구 generated mock 유지)
import { getQuiz, submit } from '@/api/be/travel-type/travel-type';
import { api } from '@/services/api/client';
import type { DestinationDto } from '@/types/api-domain';
import type {
  DestinationCategory,
  TravelTypeCode,
  TravelTypeDto,
} from '@/types/api-domain';
import type {
  RankedDestination,
  RankingType,
  TravelTypeAnswer,
  TravelTypeQuiz,
} from '@/features/ranking/types';
import { normalizeImageField } from '@/lib/secure-image-url';

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
    // 신규 Spring BE: 주간 top destination. items 는 {destinationId,destinationName,winCount}
    // — image/region/category 미제공(새 BE 한계). RankedDestination 으로 부분 매핑.
    if (params.type === 'weekly-winners') {
      const res = await getWeeklyTopDestinations({ size: params.limit });
      return (res.data?.items ?? []).map((item, i) => ({
        rank: i + 1,
        destination: {
          id: String(item.destinationId),
          name: item.destinationName ?? '',
        } as DestinationDto,
        score: item.winCount ?? 0,
      }));
    }

    // 신규 Spring BE: 시군별 우승 횟수 집계. {region,winCount} → RegionWinsChart 는 region+score 만 사용.
    if (params.type === 'by-region') {
      const res = await getRegionRankings();
      return (res.data ?? []).map((r, i) => ({
        rank: i + 1,
        destination: { region: r.region } as DestinationDto,
        score: r.winCount ?? 0,
      }));
    }

    // 그 외 타입(recommended/by-category/seasonal/by-travel-type)은 새 Spring BE 미지원.
    // real-BE 모드(USE_MSW=false)에선 dead(500) → 빈 배열로 degrade (호출부가 빈 상태 처리).
    // mock 모드에서만 구 generated 호출(MSW handler 가 데이터 제공).
    if (process.env.NEXT_PUBLIC_USE_MSW !== 'true') return [];
    // ⚠️ Spring 미지원(generic /rankings) — MSW mock. BE 추가 필요.
    const res = (
      await api.get<RankedDestination[]>('/rankings', {
        params: {
          type: params.type,
          limit: params.limit != null ? String(params.limit) : undefined,
        },
      })
    ).data;
    return res.map((r) => ({
      ...r,
      destination: normalizeImageField(r.destination),
    }));
  },

  // 신규 Spring BE: GET /travel-types/quiz — QuizDto (id: number) → 도메인 TravelTypeQuiz (id: string).
  getTravelTypeQuiz: async (): Promise<TravelTypeQuiz> => {
    const res = await getQuiz();
    return {
      questions: (res.data?.questions ?? []).map((q) => ({
        id: String(q.id),
        text: q.text ?? '',
        options: (q.options ?? []).map((o) => ({
          id: String(o.id),
          text: o.text ?? '',
        })),
      })),
    };
  },

  // 신규 Spring BE: POST /travel-types/submit — 도메인 answer(string id) → SubmitQuizDto(number id).
  // 응답 TravelTypeResultDto 는 thin(code/title/emoji/description/tags) → 도메인 TravelTypeDto 로 매핑.
  // keywords ← tags, recommended ← [] (BE 미제공, GET /me 가 별도 빌드), compatibility 는 GET /me 에서 채워짐.
  submitTravelType: async (
    answers: TravelTypeAnswer[],
  ): Promise<TravelTypeDto> => {
    const res = await submit({
      answers: answers.map((a) => ({
        questionId: Number(a.questionId),
        optionId: Number(a.optionId),
      })),
    });
    const r = res.data;
    // compatibility 는 BE 미제공 → 생략(UI 가 optional 처리). thin → 도메인 캐스팅.
    return normalizeTravelTypeImages({
      code: r?.code,
      title: r?.title ?? '',
      description: r?.description ?? '',
      emoji: r?.emoji ?? '',
      keywords: r?.tags ?? [],
      recommended: [],
    } as unknown as TravelTypeDto);
  },

  // ⚠️ Spring 미지원 (travel-types/me GET·PATCH) — MSW mock. BE 추가 필요.
  getMyTravelType: async (): Promise<TravelTypeDto | null> => {
    const res = (await api.get<TravelTypeDto | null>('/travel-types/me')).data;
    return res ? normalizeTravelTypeImages(res) : null;
  },

  setMyTravelType: async (code: TravelTypeCode): Promise<TravelTypeDto> => {
    const res = (
      await api.patch<TravelTypeDto>('/travel-types/me', { code })
    ).data;
    return normalizeTravelTypeImages(res);
  },
};

function normalizeTravelTypeImages(input: TravelTypeDto): TravelTypeDto {
  if (!input.recommended?.length) return input;
  return {
    ...input,
    recommended: input.recommended.map(normalizeImageField),
  };
}
