'use client';

import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/feedback/Skeleton';
import { useWeeklyTopDestinations } from '@/features/ranking/hooks/use-ranking';
import { Top5Card } from '@/features/ranking/components/Top5Card';
import { RegionWinsChart } from '@/features/ranking/components/RegionWinsChart';
import styles from './RankingPageContent.module.scss';

/**
 * 랭킹 페이지
 *
 *   1) 이번주 우승 Top 5 — Top5Card 리스트
 *   2) 시군별 우승 횟수 — 가로 bar 차트 (클릭 시 /region/[code])
 *
 * 추가 섹션(추천/숨은명소/유형테스트)은 추후.
 */
export function RankingPageContent() {
  const t = useTranslations('ranking.sections');
  const { data, isLoading, isError, refetch } = useWeeklyTopDestinations(5);

  return (
    <div className={styles.wrap}>
      {/* 1) Top 5 */}
      <section>
        <h2 className={styles.sectionTitle}>
          {t('weeklyWinners', { limit: 5 })}
        </h2>
        {isLoading && (
          <div className={styles.list}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} width="100%" height={72} radius="lg" />
            ))}
          </div>
        )}
        {isError && (
          <div className={styles.error}>
            <p>{t('error')}</p>
            <button
              type="button"
              className={styles.retry}
              onClick={() => refetch()}
            >
              {t('retry')}
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
      </section>

      {/* 2) 시군별 우승 횟수 차트 */}
      <section>
        <h2 className={styles.sectionTitle}>{t('byRegionChart')}</h2>
        <p className={styles.chartHint}>{t('byRegionChartHint')}</p>
        <RegionWinsChart />
      </section>
    </div>
  );
}
