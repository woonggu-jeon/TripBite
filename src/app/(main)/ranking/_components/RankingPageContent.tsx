'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Trophy } from 'lucide-react';
import { SkeletonList } from '@/components/feedback/SkeletonList';
import { Button, PageSection } from '@/components/ui';
import { WeekLabel } from '@/components/ui/WeekLabel';
import { useWeeklyTopDestinations } from '@/features/ranking/hooks/use-ranking';
import { Top5Card } from '@/features/ranking/components/Top5Card';
import { RegionWinsChart } from '@/features/ranking/components/RegionWinsChart';
import { haptic } from '@/lib/haptic';
import styles from './RankingPageContent.module.scss';

/**
 * 랭킹 페이지
 *
 *   1) 이번주 우승 Top 5 — Top5Card 리스트
 *   2) 시군별 우승 횟수 — 가로 bar 차트 (클릭 시 /region/[code])
 *
 * 빈 상태 — Figma "RNK · 랭킹 (빈 상태)" 정합:
 *   - week label 단일줄 "{month}월 {week}주차 · 이번 주 집계가 시작됐어요"
 *   - empty-popular card (white border + 84 circle + Trophy + heading/hint
 *     + primary lg button)
 *   - empty-recent card (white border + heading/hint, disabled color)
 *   RegionWinsChart 는 빈 상태 시 미노출 — Figma spec 정합.
 */
export function RankingPageContent() {
  const t = useTranslations('ranking');
  const tSection = useTranslations('ranking.sections');
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useWeeklyTopDestinations(5);
  const isEmpty = !isLoading && !isError && data && data.length === 0;

  if (isEmpty) {
    return (
      <div className={styles.wrap}>
        <WeekLabel variant="inline" hint={t('emptyTallyHint')} />

        <div className={styles.emptyCard}>
          <div className={styles.emptyHead}>
            <span className={styles.emptyHeadTitle}>
              {t('emptyPopular.title')}
            </span>
          </div>
          <div className={styles.emptyCircle} aria-hidden>
            <Trophy size={40} strokeWidth={2.5} />
          </div>
          <div className={styles.emptyText}>
            <p className={styles.emptyTextTitle}>{t('emptyPopular.heading')}</p>
            <p className={styles.emptyTextHint}>{t('emptyPopular.hint')}</p>
          </div>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => {
              haptic.tap();
              router.push('/tournament');
            }}
          >
            {t('emptyPopular.cta')}
          </Button>
        </div>

        <div className={styles.emptyCardSmall}>
          <div className={styles.emptyHead}>
            <span className={styles.emptyHeadTitle}>
              {t('emptyRecent.title')}
            </span>
          </div>
          <div className={styles.emptyText}>
            <p className={styles.emptyTextTitleDisabled}>
              {t('emptyRecent.heading')}
            </p>
            <p className={styles.emptyTextHintDisabled}>
              {t('emptyRecent.hint')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <WeekLabel variant="split" />

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
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              {tSection('retry')}
            </Button>
          </div>
        )}
        {data && data.length > 0 && (
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
