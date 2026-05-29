/**
 * 차트 공통 타입 — 라이브러리에 독립적
 *
 * Recharts 내부 타입을 외부로 노출하지 않음.
 * 추후 visx / uPlot 등으로 교체해도 호출부 코드는 동일.
 */

export type ChartDatum = Record<string, string | number | null | undefined>;

export type SeriesConfig = {
  key: string;
  /** 범례 라벨 (i18n 적용된 문자열) */
  label?: string;
  /** CSS color value — 미지정 시 팔레트에서 자동 할당 */
  color?: string;
};

export type AxisConfig = {
  /** datum 안의 어떤 키를 축으로 쓸지 */
  dataKey: string;
  label?: string;
  /** 숫자/카테고리/날짜 — 차트 라이브러리에 hint */
  type?: 'number' | 'category' | 'time';
  /** Tick 포맷터 — Intl.NumberFormat / DateTimeFormat 위임 권장 */
  format?: (value: unknown) => string;
};

export type ChartProps<T extends ChartDatum = ChartDatum> = {
  data: T[];
  series: SeriesConfig[];
  xAxis: AxisConfig;
  yAxis?: Omit<AxisConfig, 'dataKey'>;
  /** 컨테이너 높이 (필수, ResponsiveContainer 사용 시에도) */
  height?: number;
  /** 범례 표시 여부 (기본 true, 시리즈 1개면 자동 숨김) */
  showLegend?: boolean;
  /** 그리드 표시 여부 */
  showGrid?: boolean;
  /** 빈 데이터 메시지 (미지정 시 i18n 'chart.empty' 사용) */
  emptyMessage?: string;
  /**
   * BarChart 전용 — 'horizontal'(기본, 세로 막대) / 'vertical'(가로 막대).
   * 가로 막대 시 xAxis 가 numeric, yAxis 가 category 로 자동 매핑.
   */
  layout?: 'horizontal' | 'vertical';
  /** Bar 클릭 콜백 — payload(원본 datum) 전달 */
  onBarClick?: (datum: T, index: number) => void;
};
