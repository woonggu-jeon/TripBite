'use client';

import {
  Line,
  LineChart as RLineChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ChartDatum, ChartProps } from '@/features/chart/types';
import { getSeriesColor } from '@/features/chart/utils/colors';

/**
 * LineChart 실제 구현
 *
 * 이 파일은 dynamic import 의 대상이 됩니다 (LineChart.tsx 의 wrapper 참고).
 * → recharts 코드가 별도 청크로 분리되어 main bundle에서 빠짐.
 *
 * 외부에는 ChartProps만 노출되므로 추후 라이브러리 교체 시
 * 이 파일만 다시 작성하면 됨.
 */
export default function LineChartImpl<T extends ChartDatum>({
  data,
  series,
  xAxis,
  yAxis,
  height = 240,
  showLegend,
  showGrid = true,
}: ChartProps<T>) {
  const showLegendEffective = showLegend ?? series.length > 1;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RLineChart
        data={data}
        margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
      >
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-border)"
            vertical={false}
          />
        )}
        <XAxis
          dataKey={xAxis.dataKey}
          stroke="var(--color-muted)"
          fontSize={12}
          tickLine={false}
          tickFormatter={xAxis.format as (v: unknown) => string}
        />
        <YAxis
          stroke="var(--color-muted)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={yAxis?.format as (v: unknown) => string}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        {showLegendEffective && <Legend />}
        {series.map((s, i) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label ?? s.key}
            stroke={s.color ?? getSeriesColor(i)}
            strokeWidth={2}
            dot={false}
            // 60fps 유지: 데이터 변경 시 애니메이션 비활성화 추천
            isAnimationActive={false}
          />
        ))}
      </RLineChart>
    </ResponsiveContainer>
  );
}
