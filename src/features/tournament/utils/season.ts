import type { Season } from '@/api/generated/schemas';

/**
 * 월 → 계절 매핑 (북반구 기상학적 분류).
 *   3~5월   → spring
 *   6~8월   → summer
 *   9~11월  → autumn
 *   12·1·2월 → winter
 *
 * month 인자 (1~12) 받는 순수 함수 — SSR/CSR/테스트 모두 결정적.
 */
export function getSeasonByMonth(month: number): Season {
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

/**
 * 현재 월 기준 계절. 클라이언트 시간 기준.
 * (UTC/KST 시차로 월말/월초 경계에서 server 와 다를 수 있어 mount 후 호출 권장.)
 */
export function getCurrentSeason(): Season {
  return getSeasonByMonth(new Date().getMonth() + 1);
}
