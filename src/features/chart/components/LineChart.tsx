'use client';

import { useTranslations } from 'next-intl';
import { clientOnly } from '@/lib/dynamic';
import { ChartSkeleton } from './ChartSkeleton';
import type { ChartDatum, ChartProps } from '@/features/chart/types';

/**
 * <LineChart />
 *
 * 사용:
 *   <LineChart
 *     data={data}
 *     series={[{ key: 'wins', label: t('weeklyWins') }]}
 *     xAxis={{ dataKey: 'date', type: 'time' }}
 *     height={240}
 *   />
 *
 * 성능:
 *   - recharts 코드는 LineChartImpl.tsx 로 분리되어
 *     이 페이지를 처음 방문할 때 단일 청크로 다운로드
 *   - 로딩 동안 Skeleton 표시 (레이아웃 시프트 0)
 *   - SSR 비활성화 (recharts는 client-side only)
 */

// 동일한 height를 skeleton에도 전달하기 위한 트릭은 없으므로
// 모든 차트가 240 기본 — 다르면 호출부에서 height prop 전달.
const LineChartLazy = clientOnly<ChartProps<ChartDatum>>(
  () => import('./LineChartImpl'),
  {
    loading: () => <ChartSkeleton />,
  },
);

export function LineChart<T extends ChartDatum>(props: ChartProps<T>) {
  const t = useTranslations('chart');

  if (!props.data || props.data.length === 0) {
    return (
      <div
        style={{
          height: props.height ?? 240,
          display: 'grid',
          placeItems: 'center',
          color: 'var(--color-muted)',
          fontSize: 14,
          border: '1px dashed var(--color-border)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        {props.emptyMessage ?? t('empty')}
      </div>
    );
  }

  return <LineChartLazy {...(props as unknown as ChartProps<ChartDatum>)} />;
}
