'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ROUTES } from '@/constants/routes';
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
 * 컴포넌트 분할 (features/mypage/components):
 *   - <ProfileCard />              닉네임 + 유형 뱃지
 *   - <StampBookBanner />          도장책 진입 배너 → /mypage/stamps
 *   - <SavedTournamentsSection />  저장된 우승지 (최대 10)
 *   - <TournamentHistorySection /> 토너먼트 기록 (InfiniteList)
 *
 * 편지함 영역은 마이페이지에서 미노출 (요구사항). /letter 라우트는 유지.
 * 계정 액션 (로그아웃 등)은 /settings 페이지로 이동.
 */
export function MyPageClient() {
  const t = useTranslations('mypage.sections');

  return (
    <div className={styles.grid}>
      {/* 1) 프로필 */}
      <PageSection title={t('profile')}>
        <ProfileCard />
      </PageSection>

      {/* 2) 닉네임 변경은 설정 페이지로 이동됨. */}

      {/* 3) 도장책 — 배너 진입점. 전체 지도는 /mypage/stamps */}
      <PageSection title={t('stampMap')}>
        <StampBookBanner />
      </PageSection>

      {/* 4) 저장된 우승지 — 가로 스크롤 Carousel + 헤더 우측 "전체보기 (N)" Link */}
      <PageSection
        title={t('savedTournaments')}
        action={<SavedTournamentsViewAll />}
      >
        <SavedTournamentsSection />
      </PageSection>

      {/* 5) 토너먼트 기록 */}
      <PageSection title={t('tournamentHistory')}>
        <TournamentHistorySection />
      </PageSection>

      {/* 계정 관리는 /settings 페이지로 */}
      <Link href={ROUTES.SETTINGS} className={styles.settingsLink}>
        {t('goToSettings')}
      </Link>
    </div>
  );
}
