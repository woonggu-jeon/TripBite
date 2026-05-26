'use client';

import { useTranslations } from 'next-intl';
import { clientOnly } from '@/lib/dynamic';
import { ChartSkeleton } from './ChartSkeleton';
import type { ChartDatum, ChartProps } from '@/features/chart/types';

const BarChartLazy = clientOnly<ChartProps<ChartDatum>>(
  () => import('./BarChartImpl'),
  { loading: () => <ChartSkeleton /> },
);

export function BarChart<T extends ChartDatum>(props: ChartProps<T>) {
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

  return <BarChartLazy {...(props as ChartProps<ChartDatum>)} />;
}
