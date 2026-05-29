'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ChevronRight } from 'lucide-react';
import { useRanking } from '@/features/ranking/hooks/use-ranking';
import { isRegionCode, type RegionCode } from '@/constants/regions';
import { haptic } from '@/lib/haptic';
import styles from './RegionWinsChart.module.scss';

/**
 * 시군별 우승 횟수 — CSS 가로 막대 (Recharts 미사용).
 *
 *   - 11개 시군 한정이라 라이브러리 차트보다 표 형식이 더 직관적
 *   - 행마다 (rank · 시군명 · 막대 · 우승수) grid 4열
 *   - 막대 width = (wins / max) * 100%
 *   - 행 클릭 → /region/[code]
 *   - 막대 width transition 으로 mount 시 0 → 실제 % 채워짐
 */
type Row = {
  rank: number;
  region: string;
  code: RegionCode;
  wins: number;
  ratio: number; // 0~1
};

export function RegionWinsChart() {
  const t = useTranslations('ranking');
  const tRegion = useTranslations('region.names');
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useRanking({
    type: 'by-region',
  });

  const rows: Row[] = useMemo(() => {
    if (!data) return [];
    const valid = data.filter((r) => isRegionCode(r.destination.region));
    if (valid.length === 0) return [];
    const max = Math.max(...valid.map((r) => r.score), 1);
    return valid.map((r, i) => {
      const code = r.destination.region as RegionCode;
      const full = tRegion(code as Parameters<typeof tRegion>[0]);
      return {
        rank: i + 1,
        region: full.replace(/(시|군)$/u, ''),
        code,
        wins: r.score,
        ratio: r.score / max,
      };
    });
  }, [data, tRegion]);

  if (isLoading) {
    return <div className={styles.fallback}>{t('chart.loading')}</div>;
  }
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
  if (rows.length === 0) {
    return <div className={styles.fallback}>{t('chart.empty')}</div>;
  }

  return (
    <ul className={styles.list}>
      {rows.map((r) => (
        <li key={r.code}>
          <button
            type="button"
            className={styles.row}
            onClick={() => {
              haptic.tap();
              router.push(`/region/${r.code}`);
            }}
            aria-label={t('chart.rowAriaLabel', {
              region: r.region,
              wins: r.wins,
            })}
          >
            <span className={styles.rank}>{r.rank}</span>
            <span className={styles.regionName}>{r.region}</span>
            <span className={styles.barTrack} aria-hidden>
              <span
                className={styles.barFill}
                style={{ width: `${Math.max(4, r.ratio * 100)}%` }}
              />
            </span>
            <span className={styles.wins}>
              <span className={styles.winsNumber}>{r.wins}</span>
              <span className={styles.winsUnit}>{t('winsUnit')}</span>
            </span>
            <ChevronRight className={styles.chevron} size={16} aria-hidden />
          </button>
        </li>
      ))}
    </ul>
  );
}
