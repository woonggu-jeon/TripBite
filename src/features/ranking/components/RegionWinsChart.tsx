'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { BarChart } from '@/features/chart/components/BarChart';
import { useRanking } from '@/features/ranking/hooks/use-ranking';
import { isRegionCode } from '@/constants/regions';
import { haptic } from '@/lib/haptic';
import styles from './RegionWinsChart.module.scss';

/**
 * 시군별 우승 횟수 — 가로 막대 차트.
 *
 *   bar onClick → /region/[code] 이동
 *   datum: { region: shortName, code, wins }
 */
type Datum = {
  region: string;
  code: string;
  wins: number;
};

export function RegionWinsChart() {
  const t = useTranslations('ranking');
  const tRegion = useTranslations('region.names');
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useRanking({
    type: 'by-region',
  });

  const chartData: Datum[] = useMemo(() => {
    if (!data) return [];
    return data.map((r) => {
      const code = r.destination.region;
      const full = isRegionCode(code)
        ? tRegion(code as Parameters<typeof tRegion>[0])
        : code;
      return {
        region: full.replace(/(시|군)$/u, ''),
        code,
        wins: r.score,
      };
    });
  }, [data, tRegion]);

  if (isLoading)
    return <div className={styles.fallback}>{t('chart.loading')}</div>;
  if (isError || !data) {
    return (
      <div className={styles.fallback}>
        <p>{t('chart.error')}</p>
        <button
          type="button"
          className={styles.retry}
          onClick={() => refetch()}
        >
          {t('chart.retry')}
        </button>
      </div>
    );
  }

  return (
    <BarChart<Datum>
      data={chartData}
      series={[
        {
          key: 'wins',
          label: t('chart.winsLabel'),
          color: 'var(--color-primary)',
        },
      ]}
      xAxis={{ dataKey: 'region', type: 'category' }}
      yAxis={{ type: 'number' }}
      layout="vertical"
      height={Math.max(280, chartData.length * 32 + 40)}
      showLegend={false}
      onBarClick={(d) => {
        haptic.tap();
        if (isRegionCode(d.code)) {
          router.push(`/region/${d.code}`);
        }
      }}
      emptyMessage={t('chart.empty')}
    />
  );
}
