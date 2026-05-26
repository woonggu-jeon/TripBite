'use client';

import {
  Bar,
  BarChart as RBarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ChartDatum, ChartProps } from '@/features/chart/types';
import { getSeriesColor } from '@/features/chart/utils/colors';

export default function BarChartImpl<T extends ChartDatum>({
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
      <RBarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        {showGrid && (
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
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
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label ?? s.key}
            fill={s.color ?? getSeriesColor(i)}
            radius={[6, 6, 0, 0]}
            isAnimationActive={false}
          />
        ))}
      </RBarChart>
    </ResponsiveContainer>
  );
}
