'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ChevronRight, Trophy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Carousel } from '@/features/carousel';
import { Skeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Button } from '@/components/ui';
import { useSavedTournaments } from '@/features/tournament/hooks/use-tournament';
import { useResponsiveSlidesPerView } from '@/hooks/use-responsive-slides-per-view';
import { SavedTournamentCard } from './SavedTournamentCard';
import styles from './SavedTournamentsSection.module.scss';

/**
 * 저장된 토너먼트 우승 여행지 — 최대 20개 가로 스크롤 카드 (Carousel).
 *
 * 빈 상태는 Figma "MY_01" empty-saved card 정합 (white card padding 20 gap 16
 * + title B_14 center + hint R_12 center + primary button 280×52). 이전
 * AsyncSection 의 EmptyState 56 circle 패턴은 시각 다름 → 직접 분기.
 *
 * 헤더 우측 "전체보기 (N)" Link — /mypage/saved-tournaments 상세 페이지.
 */
export function SavedTournamentsSection() {
  const t = useTranslations('mypage.savedTournaments');
  const router = useRouter();
  const slidesPerView = useResponsiveSlidesPerView();
  const { data, isLoading, isError, refetch } = useSavedTournaments();

  if (isLoading) {
    // Figma DestinationCard 152×168 — carousel 가로 스크롤 skeleton.
    // SkeletonList Fragment 는 column stack 회귀 → 자체 horizontal flex.
    return (
      <div className={styles.skeletonRow} aria-busy>
        <Skeleton width={152} height={168} radius="lg" />
        <Skeleton width={152} height={168} radius="lg" />
        <Skeleton width={152} height={168} radius="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={<Trophy size={28} aria-hidden />}
        title={t('error')}
        action={
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            {t('retry')}
          </Button>
        }
      />
    );
  }

  const items = data ?? [];
  if (items.length === 0) {
    // Figma empty-saved — 320×148 white card + title + hint + primary button.
    return (
      <div className={styles.empty}>
        <div className={styles.emptyText}>
          <p className={styles.emptyTitle}>{t('empty')}</p>
          <p className={styles.emptyHint}>{t('emptyHint')}</p>
        </div>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => router.push('/tournament')}
        >
          {t('startTournament')}
        </Button>
      </div>
    );
  }

  return (
    <Carousel
      slides={items.slice(0, 10)}
      renderSlide={(saved) => <SavedTournamentCard saved={saved} />}
      keyExtractor={(saved) => saved.id}
      options={{ slidesPerView, gap: 8 }}
      showDots={false}
      fallbackHeight={200}
      ariaLabel={t('allTitle')}
    />
  );
}

/**
 * PageSection action 슬롯용 — 헤더 우측 "전체보기" Link + chev.
 * /mypage/saved-tournaments 상세 페이지 진입점.
 *
 * Figma "MY_01" sec-title 우측 muted text 패턴 정합 (stampMapViewAll 과
 * 동일 시각 — Caption R_12 muted + ChevronRight 14). 이전 "(N)" count
 * + primary bold 회귀 정정 (2026-06-23).
 * data 없을 때는 미노출.
 */
export function SavedTournamentsViewAll() {
  const tSections = useTranslations('mypage.sections');
  const { data } = useSavedTournaments();
  const count = data?.length ?? 0;
  if (count === 0) return null;
  return (
    <Link
      href="/mypage/saved-tournaments"
      prefetch={false}
      className={styles.viewAll}
    >
      <span>{tSections('savedTournamentsViewAll')}</span>
      <ChevronRight size={14} aria-hidden />
    </Link>
  );
}
