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
 * 시군별 우승 횟수 — Recharts 가로 막대(레이아웃 'vertical') 백업 구현.
 *
 * 현재 페이지에서는 `RegionWinsChart`(CSS 가로 막대 리스트)를 사용 중.
 * 본 컴포넌트는 라이브러리 차트가 필요한 경우(예: 시리즈 추가, tooltip 강조,
 * tick 포맷터 등 Recharts 고유 기능 활용) 를 위해 보존.
 *
 *   import { RegionWinsBarChart } from '@/features/ranking/components/RegionWinsBarChart';
 *   <RegionWinsBarChart />
 */
type Datum = {
  region: string;
  code: string;
  wins: number;
};

export function RegionWinsBarChart() {
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
