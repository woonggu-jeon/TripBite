/**
 * Chart feature — Public API
 *
 * 호출부에서는 이 진입점만 import:
 *   import { LineChart, BarChart, PieChart } from '@/features/chart';
 *
 * 사용 시 자동으로:
 *   - recharts 코드가 별도 청크로 분리됨 (main bundle에 미포함)
 *   - 로딩 중 Skeleton 표시 → 레이아웃 시프트 0
 *   - 빈 데이터 시 i18n empty 메시지
 *   - CSS 변수 기반 색상 (다크모드 자동 대응)
 *
 * 라이브러리 교체 시:
 *   - components/*Impl.tsx 만 다시 작성
 *   - wrapper와 호출부는 변경 불필요
 */
export { LineChart } from './components/LineChart';
export { BarChart } from './components/BarChart';
export { PieChart } from './components/PieChart';
export { ChartSkeleton } from './components/ChartSkeleton';
export type { ChartProps, ChartDatum, SeriesConfig, AxisConfig } from './types';
export type { PieDatum, PieChartProps } from './components/PieChartImpl';
