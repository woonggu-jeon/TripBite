'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Trophy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Carousel } from '@/features/carousel';
import { SkeletonList } from '@/components/feedback/SkeletonList';
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
    return <SkeletonList count={2} height={168} radius="lg" />;
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
 * PageSection action 슬롯용 — 헤더 우측 "전체보기 (N)" Link.
 * /mypage/saved-tournaments 상세 페이지 진입점. data 없을 때는 미노출.
 */
export function SavedTournamentsViewAll() {
  const t = useTranslations('mypage.savedTournaments');
  const { data } = useSavedTournaments();
  const count = data?.length ?? 0;
  if (count === 0) return null;
  return (
    <Link
      href="/mypage/saved-tournaments"
      prefetch={false}
      className={styles.viewAll}
    >
      {t('viewAll', { count })}
    </Link>
  );
}
