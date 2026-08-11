'use client';

import { Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Skeleton } from '@/components/feedback/Skeleton';
import { SkeletonList } from '@/components/feedback/SkeletonList';
import { Button, PageSection } from '@/components/ui';
import { RegionWinsChart } from '@/features/ranking/components/RegionWinsChart';
import { Top5Card } from '@/features/ranking/components/Top5Card';
import { useWeeklyTopDestinations } from '@/features/ranking/hooks/use-ranking';
import { currentWeekLabel } from '@/lib/week-label';
import styles from './RankingPageContent.module.scss';

/**
 * 랭킹 페이지
 *
 *   1) 이번주 우승 Top 5 — Top5Card 리스트
 *   2) 시군별 우승 횟수 — 가로 bar 차트 (클릭 시 /region/[code])
 *
 * Figma `RNK · 랭킹` / `RNK · 랭킹 (빈 상태)` 실측:
 *   - 화면 배경 #F6F6F6 + 흰 rv-card 2장 (page.tsx 의 PageBackground)
 *   - 상단은 좌우 양끝이 아니라 **한 줄** — Caption/R_12 #393939
 *     "5월 4주차 · 매주 월요일 업데이트"
 *   - 집계가 없을 때는 뒷말이 바뀐다 → "· 이번 주 집계가 시작됐어요"
 *   - 빈 카드는 84 원형 아이콘 + 제목 + 설명 + primary CTA (emptyItme)
 */
export function RankingPageContent() {
  const t = useTranslations('ranking');
  const tSection = useTranslations('ranking.sections');
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useWeeklyTopDestinations(5);
  const weekLabel = currentWeekLabel();
  const isEmpty = !!data && data.length === 0;

  return (
    <div className={styles.wrap}>
      {/* Figma `Title` — 주차와 뒷말을 " · " 로 이은 한 줄 */}
      <p className={styles.meta}>
        {t('weekLabel', { month: weekLabel.month, week: weekLabel.week })} ·{' '}
        {isEmpty ? t('emptyTallyHint') : t('updateNote')}
      </p>

      {/* 1) Top 5 — Figma `rv-card`: 제목 + 1위 hero + 2~5위 행을 카드 하나로 */}
      <PageSection
        title={tSection('weeklyWinners', { limit: 5 })}
        variant="card"
      >
        {isLoading && (
          <div className={styles.list}>
            {/* 1위는 사진 배경 hero (18/11), 2~5위는 row — 로딩도 같은 형태로 */}
            <Skeleton width="100%" aspectRatio="18 / 11" radius="md" />
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
        {isEmpty && (
          <EmptyState
            icon={<Trophy size={28} aria-hidden />}
            title={tSection('empty')}
            description={t('emptyPopular.hint')}
            action={
              <Button
                variant="primary"
                fullWidth
                onClick={() => router.push('/tournament')}
              >
                {t('emptyPopular.cta')}
              </Button>
            }
          />
        )}
      </PageSection>

      {/* 2) 시군별 우승 횟수 — 같은 `rv-card` 묶음, 행마다 하단 구분선.
          Figma 는 이 카드에 보조설명을 두지 않는다 (행 자체가 버튼이고
          aria-label 로 "상세 보기" 를 이미 읽어준다). */}
      <PageSection title={tSection('byRegionChart')} variant="card">
        <RegionWinsChart />
      </PageSection>
    </div>
  );
}
