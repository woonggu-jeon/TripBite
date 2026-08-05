'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Icon } from '@/components/icon';
import { ROUTES } from '@/constants/routes';
import { SubHeader } from '@/components/layout/SubHeader';
import { ProfileCard } from '@/features/mypage/components/ProfileCard';
import {
  SavedTournamentsSection,
  SavedTournamentsViewAll,
} from '@/features/mypage/components/SavedTournamentsSection';
import { TournamentHistorySection } from '@/features/mypage/components/TournamentHistorySection';
import { StampBookBanner } from '@/features/mypage/components/StampBookBanner';
import { PageSection } from '@/components/ui';
import styles from './MyPageClient.module.scss';

/**
 * 마이페이지 컴포지션
 *
 * Figma `MY_01 · 마이페이지` 구성:
 *   header (제목 + 우측 톱니)
 *   pf      프로필 블록 — 풀블리드, 섹션 제목 없음
 *   body    V gap 24
 *     ├ 충북 도장책    + "더보기"  → stamp-banner (진행률 바)
 *     ├ 저장한 우승지  + "더보기"  → 가로 카드 그리드
 *     └ 최근 토너먼트 (더보기 없음) → recent-box (묶음 카드 + 행 구분선)
 *
 * 설정 진입은 시안대로 헤더 톱니 — 구 하단 "설정으로 이동" 링크는 제거.
 */
export function MyPageClient() {
  const t = useTranslations('mypage.sections');
  const tPage = useTranslations('mypage');
  const tCommon = useTranslations('common');

  return (
    <>
      <SubHeader
        title={tPage('title')}
        rightSlot={
          <Link
            href={ROUTES.SETTINGS}
            className={styles.settingsLink}
            aria-label={t('goToSettings')}
          >
            <Icon name="settings" size={24} />
          </Link>
        }
      />
      <div className={styles.grid}>
        {/* 1) 프로필 — Figma `pf`. 섹션 제목 없이 헤더 바로 아래 붙는다. */}
        <ProfileCard />

        {/* 2) 도장책 — 배너 진입점. 전체 지도는 /mypage/stamps */}
        <PageSection
          title={t('stampMap')}
          action={
            <Link href="/mypage/stamps">
              {tCommon('showMore')}
              <Icon name="right-20" size={16} />
            </Link>
          }
        >
          <StampBookBanner />
        </PageSection>

        {/* 3) 저장된 우승지 — 가로 스크롤 Carousel + 헤더 우측 "전체보기 (N)" */}
        <PageSection
          title={t('savedTournaments')}
          action={<SavedTournamentsViewAll />}
        >
          <SavedTournamentsSection />
        </PageSection>

        {/* 4) 토너먼트 기록 — Figma 는 섹션 제목이 카드 밖이고 `recent-box` 가
            따로 카드다. 카드 껍데기는 TournamentHistorySection 이 직접 갖는다. */}
        <PageSection title={t('tournamentHistory')}>
          <TournamentHistorySection />
        </PageSection>
      </div>
    </>
  );
}
