'use client';

import { useTranslations } from 'next-intl';
import { clientOnly } from '@/lib/dynamic';
import { ChartSkeleton } from './ChartSkeleton';
import type { PieChartProps } from './PieChartImpl';

const PieChartLazy = clientOnly<PieChartProps>(() => import('./PieChartImpl'), {
  loading: () => <ChartSkeleton />,
});

export function PieChart(props: PieChartProps) {
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
        {t('empty')}
      </div>
    );
  }

  return <PieChartLazy {...props} />;
}
