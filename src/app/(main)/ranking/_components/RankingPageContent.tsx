'use client';

import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/feedback/Skeleton';
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

      {/* 1) Top 5 — Figma `rv-card`: 제목 + 1위 hero + 2~5위 행을 카드 하나로 */}
      <PageSection
        title={tSection('weeklyWinners', { limit: 5 })}
        variant="card"
      >
        {isLoading && (
          <div className={styles.list}>
            {/* 1위는 사진 배경 hero (20/11), 2~5위는 row — 로딩도 같은 형태로 */}
            <Skeleton width="100%" aspectRatio="20 / 11" radius="md" />
            <SkeletonList count={4} height={64} radius="md" />
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
        {data && data.length > 0 && (
          <div className={styles.list}>
            {data.map((item) => (
              // rank 포함 — 같은 여행지가 복수 순위에 나올 수 있어(집계 데이터) key 유일성 보장.
              <Top5Card
                key={`${item.destination.id ?? 'd'}-${item.rank}`}
                item={item}
              />
            ))}
          </div>
        )}
        {data && data.length === 0 && (
          <p className={styles.error}>{tSection('empty')}</p>
        )}
      </PageSection>

      {/* 2) 시군별 우승 횟수 — 같은 `rv-card` 묶음, 행마다 하단 구분선 */}
      <PageSection
        title={tSection('byRegionChart')}
        hint={tSection('byRegionChartHint')}
        variant="card"
      >
        <RegionWinsChart />
      </PageSection>
    </div>
  );
}
