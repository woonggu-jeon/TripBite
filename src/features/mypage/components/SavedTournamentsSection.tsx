'use client';

import { Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AsyncSection } from '@/components/feedback/AsyncSection';
import { Icon } from '@/components/icon';
import { Button } from '@/components/ui';
import { Carousel } from '@/features/carousel';
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
          fullWidth
          onClick={() => router.push('/tournament')}
        >
          {t('startTournament')}
        </Button>
      }
      // Figma `empty-saved` — 섹션 안 흰 카드. 84px 원형 아이콘은 없다.
      emptyVariant="card"
      isEmpty={(d) => d.length === 0}
    >
      {(data) => (
        // Figma `saved-grid` 는 폭 408 로 화면 오른쪽 끝을 넘어간다 —
        // 다음 카드가 20px 살짝 보이는 게 "옆으로 넘길 수 있다"는 신호다.
        // 본문 여백(--content-pad)을 오른쪽만 음수 마진으로 상쇄한다.
        <div className={styles.bleedRight}>
          <Carousel
            slides={data.slice(0, 10)}
            renderSlide={(saved) => <SavedTournamentCard saved={saved} />}
            keyExtractor={(saved) => saved.id}
            // Figma `saved-grid` — 카드는 152 고정, gap 8, 옆 카드가 살짝 보인다.
            // (slidesPerView 계산이면 360 폭에서 174 로 커졌다)
            options={{ slidesPerView, slideWidth: 152, gap: 8 }}
            showDots={false}
            fallbackHeight={200}
            ariaLabel={t('allTitle')}
          />
        </div>
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
      {/* Figma sec-title 우측은 "전체 보기 ›" — chevron 까지 포함이다
          (도장책 섹션 action 과 같은 아이콘/크기). */}
      <Icon name="right-20" size={16} />
    </Link>
  );
}
