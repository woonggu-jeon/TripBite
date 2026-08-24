/**
 * 카테고리 / 시즌 → emoji 매핑. 6+ 파일에 inline 중복 정의되던 것을 단일 출처로.
 *
 * 사용:
 *   import { categoryEmoji, seasonEmoji } from '@/constants/emoji-map';
 *   const e = categoryEmoji('festival');
 */
import type { DestinationCategory, Season } from '@/types/api-domain';

const CATEGORY_EMOJI: Partial<Record<DestinationCategory, string>> = {
  festival: '🎪',
  attraction: '📍',
  experience: '🎨',
};

const SEASON_EMOJI: Record<Season, string> = {
  spring: '🌸',
  summer: '☀️',
  autumn: '🍂',
  winter: '❄️',
};

/** 일반 fallback — 알 수 없는 카테고리. */
export const FALLBACK_DESTINATION_EMOJI = '📍';
/** 트로피 fallback — 우승/시즌 미상 표시. */
export const FALLBACK_TROPHY_EMOJI = '🏆';

export function categoryEmoji(
  category: string,
  fallback: string = FALLBACK_DESTINATION_EMOJI,
): string {
  return (CATEGORY_EMOJI as Record<string, string>)[category] ?? fallback;
}

export function seasonEmoji(
  season: string,
  fallback: string = FALLBACK_TROPHY_EMOJI,
): string {
  return (SEASON_EMOJI as Record<string, string>)[season] ?? fallback;
}
