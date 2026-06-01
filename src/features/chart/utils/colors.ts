/**
 * 차트 팔레트
 *
 * globals.scss 의 `--chart-1` ~ `--chart-8` 토큰 사용.
 * 다크모드 자동 대응 (CSS 변수가 dark 에서 재정의 가능 — 현재 light 와 동일).
 * 디자이너가 globals.scss 한 곳에서 차트 색 전체 조정 가능.
 *
 * 시리즈 인덱스 기반 자동 색 선택:
 *   getSeriesColor(i) → palette[i % palette.length]
 *
 * `var(--chart-*)` 문자열 그대로 recharts 의 fill / stroke prop 에 전달 가능.
 */
export const CHART_PALETTE = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
  'var(--chart-7)',
  'var(--chart-8)',
] as const;

export function getSeriesColor(index: number): string {
  // 모듈러라 항상 유효 범위지만, noUncheckedIndexedAccess 대비 fallback
  return CHART_PALETTE[index % CHART_PALETTE.length] ?? CHART_PALETTE[0];
}
