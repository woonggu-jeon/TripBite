/**
 * 차트 팔레트
 *
 * globals.scss 의 색상 토큰과 동일한 변수를 사용.
 * 다크모드 자동 대응 (CSS 변수가 dark에서 재정의됨).
 *
 * 시리즈 인덱스 기반 자동 색 선택:
 *   getSeriesColor(i) → palette[i % palette.length]
 */
export const CHART_PALETTE = [
  'var(--color-primary)',
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
] as const;

export function getSeriesColor(index: number): string {
  // 모듈러라 항상 유효 범위지만, noUncheckedIndexedAccess 대비 fallback
  return CHART_PALETTE[index % CHART_PALETTE.length] ?? CHART_PALETTE[0];
}
