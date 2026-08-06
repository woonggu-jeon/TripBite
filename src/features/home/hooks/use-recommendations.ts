'use client';

import { useQuery } from '@tanstack/react-query';
import { destinationControllerRecommendationsV1 } from '@/api/generated/destinations/destinations';
import type {
  DestinationDto,
  RecommendationsDto,
} from '@/api/generated/schemas';
import { CACHE } from '@/lib/cache';
import { secureImageUrl } from '@/lib/secure-image-url';

/**
 * 메인 "이런 여행 어때요" — Figma rec-block 전용 endpoint.
 *
 * BE: `GET /v1/destinations/recommendations` (2026-06-24 신설).
 * 응답: `RecommendationsDto { festival, attraction, experience }` 3 그룹.
 *
 * 기존 `GET /rankings?type=recommended` (TourAPI 인기순, 관광지 only) 는
 * HomeHero / 다른 사용처가 그대로 사용 — 이 endpoint 가 안정화되면 BE 가
 * retire 예정.
 *
 * imageUrl 정규화 — DestinationCard 등 일관 표시 위해 normalize.
 */
export const recommendationsKeys = {
  all: ['recommendations'] as const,
};

function normalizeImageField<T extends DestinationDto>(d: T): T {
  return { ...d, imageUrl: secureImageUrl(d.imageUrl) ?? d.imageUrl };
}

function normalize(input: RecommendationsDto): RecommendationsDto {
  return {
    festival: input.festival.map(normalizeImageField),
    attraction: input.attraction.map(normalizeImageField),
    experience: input.experience.map(normalizeImageField),
  };
}

const EMPTY_GROUPS: RecommendationsDto = {
  festival: [],
  attraction: [],
  experience: [],
};

export function useRecommendationGroups() {
  return useQuery({
    queryKey: recommendationsKeys.all,
    queryFn: async () => {
      // `/destinations/recommendations` 는 새 Spring BE 미지원 (구 NestJS 전용).
      // real-BE 모드(USE_MSW=false)에선 dead(400) → 빈 그룹 반환해 섹션 미노출.
      // mock 모드에서만 실제 호출(MSW handler 가 데이터 제공).
      if (process.env.NEXT_PUBLIC_USE_MSW !== 'true') return EMPTY_GROUPS;
      const res =
        (await destinationControllerRecommendationsV1()) as RecommendationsDto;
      return normalize(res);
    },
    ...CACHE.normal, // 5min stale
  });
}
