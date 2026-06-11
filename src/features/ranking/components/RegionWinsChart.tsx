'use client';

import { useMemo } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui';
import { useRanking } from '@/features/ranking/hooks/use-ranking';
import { isRegionCode, type RegionCode } from '@/constants/regions';
import { haptic } from '@/lib/haptic';
import { SkeletonList } from '@/components/feedback/SkeletonList';
import { EmptyState } from '@/components/feedback/EmptyState';
import { BarChart3 } from 'lucide-react';
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
    // 5 row skeleton — 시각적 자리잡이 (CLS 0). role=status — axe-core prohibited
    // attr 회피 + 스크린리더에 로딩 상태 announce.
    return (
      <div
        className={styles.skeletonList}
        role="status"
        aria-label={t('chart.loading')}
      >
        <SkeletonList count={5} height={32} radius="md" />
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
