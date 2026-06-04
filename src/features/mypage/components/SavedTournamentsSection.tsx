'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Trophy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Carousel } from '@/features/carousel';
import { Skeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Button } from '@/components/ui';
import { useSavedTournaments } from '@/features/tournament/hooks/use-tournament';
import { SavedTournamentCard } from './SavedTournamentCard';
import styles from './SavedTournamentsSection.module.scss';

/**
 * 저장된 토너먼트 우승 여행지 — 최대 10개 가로 스크롤 카드 (Carousel).
 *
 * 메인의 "지금 열리는 충북 축제" 와 동일한 패턴 — 가로 스와이퍼로 N장 모두 보임.
 * 헤더 우측에 "전체보기 (N)" Link — /mypage/saved-tournaments 상세 페이지 진입점.
 * (Carousel 자체로도 모두 보이지만, 상세 페이지는 list view 로 더 자세한 정보 제공)
 *
 * 표준 분기: isLoading → Skeleton / isError → EmptyState + retry
 * / data 0 → EmptyState + CTA / data → Carousel.
 */
function pickSlidesPerView(w: number) {
  return w <= 360 ? 1.8 : w <= 480 ? 2.2 : 3;
}

function useResponsiveSlidesPerView() {
  const [v, setV] = useState(() =>
    typeof window === 'undefined' ? 2.2 : pickSlidesPerView(window.innerWidth),
  );
  useEffect(() => {
    const onResize = () => {
      const next = pickSlidesPerView(window.innerWidth);
      setV((prev) => (prev === next ? prev : next));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return v;
}

export function SavedTournamentsSection() {
  const t = useTranslations('mypage.savedTournaments');
  const router = useRouter();
  const slidesPerView = useResponsiveSlidesPerView();
  const { data, isLoading, isError, refetch } = useSavedTournaments();

  if (isLoading) {
    return <Skeleton width="100%" height={200} radius="lg" />;
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

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={<Trophy size={28} aria-hidden />}
        title={t('empty')}
        description={t('emptyHint')}
        action={
          <Button
            variant="primary"
            size="sm"
            onClick={() => router.push('/tournament')}
          >
            {t('startTournament')}
          </Button>
        }
      />
    );
  }

  // 최대 10개 — 그 이상이 들어와도 자르기
  const slides = data.slice(0, 10);

  return (
    <Carousel
      slides={slides}
      renderSlide={(saved) => (
        <SavedTournamentCard saved={saved} layout="tile" />
      )}
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
