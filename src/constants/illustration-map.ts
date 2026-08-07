import type { IllustrationName } from '@/components/brand/Illustration';
import type { Season } from '@/api/generated/schemas';

/**
 * 도메인 값 → Figma 일러스트 이름 매핑.
 *
 * 이전에는 OS 이모지(🌸 ☀ 🍂 ❄ / 🧗 🏛 🌿 🍜 / 🌿 🎲) 를 썼는데, 이모지는
 * 플랫폼마다 모양이 달라 디자이너가 그린 세트와 절대 일치하지 않는다.
 */
const SEASON_ILLUSTRATION: Record<Season, IllustrationName> = {
  spring: 'season-spring',
  summer: 'season-summer',
  autumn: 'season-autumn',
  winter: 'season-winter',
};

/**
 * 여행 유형 코드 → 시안 `tripTypeIcon` 변형.
 * 시안 변형명(challenge/explore/rest/taste) 과 서버 코드가 다르지만 1:1 대응된다.
 */
const TRAVEL_TYPE_ILLUSTRATION: Record<string, IllustrationName> = {
  adventurer: 'triptype-challenge',
  explorer: 'triptype-explore',
  relaxer: 'triptype-rest',
  foodie: 'triptype-taste',
};

/**
 * 여행 카테고리 → 시안 `cateIcon` 변형.
 * 시안은 tour, 레포는 attraction 으로 이름만 다르고 같은 것을 가리킨다.
 */
const CATEGORY_ILLUSTRATION: Record<string, IllustrationName> = {
  festival: 'cate-festival',
  attraction: 'cate-tour',
  experience: 'cate-experience',
};

export function categoryIllustration(
  category: string,
): IllustrationName | null {
  return CATEGORY_ILLUSTRATION[category] ?? null;
}

export function seasonIllustration(season: string): IllustrationName | null {
  return (
    (SEASON_ILLUSTRATION as Record<string, IllustrationName>)[season] ?? null
  );
}

/** 알 수 없는 코드는 null — 호출 측이 서버가 준 emoji 로 fallback 한다. */
export function travelTypeIllustration(code: string): IllustrationName | null {
  return TRAVEL_TYPE_ILLUSTRATION[code] ?? null;
}
