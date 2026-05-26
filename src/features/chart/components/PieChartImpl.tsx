'use client';

import {
  Cell,
  Legend,
  Pie,
  PieChart as RPieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { getSeriesColor } from '@/features/chart/utils/colors';

export type PieDatum = {
  name: string;
  value: number;
  color?: string;
};

export type PieChartProps = {
  data: PieDatum[];
  height?: number;
  /** 도넛 차트로 만들기 */
  donut?: boolean;
  showLegend?: boolean;
};

export default function PieChartImpl({
  data,
  height = 240,
  donut = false,
  showLegend = true,
}: PieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RPieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={donut ? '55%' : 0}
          outerRadius="80%"
          paddingAngle={donut ? 2 : 0}
          isAnimationActive={false}
        >
          {data.map((d, i) => (
            <Cell key={d.name} fill={d.color ?? getSeriesColor(i)} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        {showLegend && <Legend />}
      </RPieChart>
    </ResponsiveContainer>
  );
}
