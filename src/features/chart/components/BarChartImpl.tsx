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
  layout = 'horizontal',
  onBarClick,
}: ChartProps<T>) {
  const showLegendEffective = showLegend ?? series.length > 1;
  const isVertical = layout === 'vertical';

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RBarChart
        data={data}
        layout={layout}
        margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
      >
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-border)"
            vertical={isVertical}
            horizontal={!isVertical}
          />
        )}
        {/* horizontal(세로 막대): X=category / vertical(가로 막대): X=numeric */}
        <XAxis
          {...(isVertical
            ? { type: 'number' as const }
            : { dataKey: xAxis.dataKey, type: 'category' as const })}
          stroke="var(--color-muted)"
          fontSize={12}
          tickLine={false}
          tickFormatter={
            isVertical
              ? (yAxis?.format as (v: unknown) => string)
              : (xAxis.format as (v: unknown) => string)
          }
        />
        <YAxis
          {...(isVertical
            ? {
                dataKey: xAxis.dataKey,
                type: 'category' as const,
                width: 72,
                interval: 0,
              }
            : { type: 'number' as const })}
          stroke="var(--color-muted)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={
            isVertical
              ? (xAxis.format as (v: unknown) => string)
              : (yAxis?.format as (v: unknown) => string)
          }
        />
        <Tooltip
          contentStyle={{
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            fontSize: 12,
            color: 'var(--color-fg)',
          }}
          cursor={{
            fill: 'color-mix(in srgb, var(--color-fg) 6%, transparent)',
          }}
        />
        {showLegendEffective && <Legend />}
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label ?? s.key}
            fill={s.color ?? getSeriesColor(i)}
            radius={isVertical ? [0, 6, 6, 0] : [6, 6, 0, 0]}
            isAnimationActive={false}
            onClick={(payload, index) => {
              if (!onBarClick) return;
              const datum = (payload as unknown as { payload?: T }).payload;
              if (datum) onBarClick(datum, index);
            }}
            cursor={onBarClick ? 'pointer' : undefined}
          />
        ))}
      </RBarChart>
    </ResponsiveContainer>
  );
}
