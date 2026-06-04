'use client';

import { useTranslations } from 'next-intl';
import { SkeletonList } from '@/components/feedback/SkeletonList';
import { PageSection } from '@/components/ui';
import { useWeeklyTopDestinations } from '@/features/ranking/hooks/use-ranking';
import { Top5Card } from '@/features/ranking/components/Top5Card';
import { RegionWinsChart } from '@/features/ranking/components/RegionWinsChart';
import { currentWeekLabel } from '@/lib/week-label';
import styles from './RankingPageContent.module.scss';

/**
 * 랭킹 페이지
 *
 *   1) 이번주 우승 Top 5 — Top5Card 리스트
 *   2) 시군별 우승 횟수 — 가로 bar 차트 (클릭 시 /region/[code])
 *
 * 상단 row: "M월 N주차" + "매주 월요일 업데이트" 좌우 양끝.
 */
export function RankingPageContent() {
  const t = useTranslations('ranking');
  const tSection = useTranslations('ranking.sections');
  const { data, isLoading, isError, refetch } = useWeeklyTopDestinations(5);
  const weekLabel = currentWeekLabel();

  return (
    <div className={styles.wrap}>
      <div className={styles.weekRow}>
        <span className={styles.week}>
          {t('weekLabel', { month: weekLabel.month, week: weekLabel.week })}
        </span>
        <span className={styles.updateNote}>{t('updateNote')}</span>
      </div>

      {/* 1) Top 5 */}
      <PageSection title={tSection('weeklyWinners', { limit: 5 })}>
        {isLoading && (
          <div className={styles.list}>
            <SkeletonList count={5} height={72} radius="lg" />
          </div>
        )}
        {isError && (
          <div className={styles.error}>
            <p>{tSection('error')}</p>
            <button
              type="button"
              className={styles.retry}
              onClick={() => refetch()}
            >
              {tSection('retry')}
            </button>
          </div>
        )}
        {data && (
          <div className={styles.list}>
            {data.map((item) => (
              <Top5Card
                key={item.destination.id ?? `rank-${item.rank}`}
                item={item}
              />
            ))}
          </div>
        )}
      </PageSection>

      {/* 2) 시군별 우승 횟수 차트 */}
      <PageSection
        title={tSection('byRegionChart')}
        hint={tSection('byRegionChartHint')}
      >
        <RegionWinsChart />
      </PageSection>
    </div>
  );
}
