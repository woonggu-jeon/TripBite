'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Trophy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Carousel } from '@/features/carousel';
import { AsyncSection } from '@/components/feedback/AsyncSection';
import { Button } from '@/components/ui';
import { useSavedTournaments } from '@/features/tournament/hooks/use-tournament';
import { useResponsiveSlidesPerView } from '@/hooks/use-responsive-slides-per-view';
import { SavedTournamentCard } from './SavedTournamentCard';
import styles from './SavedTournamentsSection.module.scss';

/**
 * 저장된 토너먼트 우승 여행지 — 최대 20개 가로 스크롤 카드 (Carousel).
 *
 * 메인의 "지금 열리는 충북 축제" 와 동일한 패턴 — 가로 스와이퍼로 N장 모두 보임.
 * 헤더 우측에 "전체보기 (N)" Link — /mypage/saved-tournaments 상세 페이지 진입점.
 *
 * 분기: <AsyncSection> wrapper 가 isLoading/isError/empty 표준 처리.
 */
export function SavedTournamentsSection() {
  const t = useTranslations('mypage.savedTournaments');
  const router = useRouter();
  const slidesPerView = useResponsiveSlidesPerView();
  const query = useSavedTournaments();

  return (
    <AsyncSection
      query={query}
      icon={<Trophy size={28} aria-hidden />}
      errorTitle={t('error')}
      retryLabel={t('retry')}
      emptyTitle={t('empty')}
      emptyDescription={t('emptyHint')}
      emptyAction={
        <Button
          variant="primary"
          size="sm"
          onClick={() => router.push('/tournament')}
        >
          {t('startTournament')}
        </Button>
      }
      isEmpty={(d) => d.length === 0}
    >
      {(data) => (
        <Carousel
          slides={data.slice(0, 10)}
          renderSlide={(saved) => <SavedTournamentCard saved={saved} />}
          keyExtractor={(saved) => saved.id}
          options={{ slidesPerView, gap: 8 }}
          showDots={false}
          fallbackHeight={200}
          ariaLabel={t('allTitle')}
        />
      )}
    </AsyncSection>
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
