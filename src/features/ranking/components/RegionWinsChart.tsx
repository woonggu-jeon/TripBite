'use client';

import { ChevronRight } from 'lucide-react';
import { BarChart3 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { EmptyState } from '@/components/feedback/EmptyState';
import { SkeletonList } from '@/components/feedback/SkeletonList';
import { Button } from '@/components/ui';
import { type RegionCode, isRegionCode } from '@/constants/regions';
import { useRanking } from '@/features/ranking/hooks/use-ranking';
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
    // 11 row skeleton (충북 시군 11개) × 44 height (실 row .row padding 12 0 +
    // content 20 ≈ 44h). 직전 5×32 placeholder 는 실 mount 후 11×44 와 큰 jump
    // 발생 — 사용자 피드백 2026-06-24 정합.
    return (
      <div
        className={styles.skeletonList}
        role="status"
        aria-label={t('chart.loading')}
      >
        <SkeletonList count={11} height={44} radius="md" />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className={styles.fallback}>
        <p>{t('chart.error')}</p>
        <Button variant="secondary" size="sm" onClick={() => refetch()}>
          {t('chart.retry')}
        </Button>
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<BarChart3 size={28} aria-hidden />}
        title={t('chart.empty')}
      />
    );
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
            {/* Figma Frame 36 — rank + region 같은 row gap 8. */}
            <span className={styles.label}>
              <span
                className={`${styles.rank} ${r.rank === 1 ? styles.rankFirst : ''}`}
              >
                {r.rank}
              </span>
              <span className={styles.regionName}>{r.region}</span>
            </span>
            {/* Figma bar — 160×8 #F1F1F1 + primary fill. */}
            <span className={styles.barTrack} aria-hidden>
              <span
                className={styles.barFill}
                style={{ width: `${Math.max(4, r.ratio * 100)}%` }}
              />
            </span>
            {/* Figma Frame 35 — wins + chevron row gap 4. */}
            <span className={styles.wins}>
              {r.wins}
              {t('winsUnit')}
              <ChevronRight className={styles.chevron} size={20} aria-hidden />
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
