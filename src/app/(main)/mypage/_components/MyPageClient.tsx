'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import { ProfileCard } from '@/features/mypage/components/ProfileCard';
import { SavedTournamentsSection } from '@/features/mypage/components/SavedTournamentsSection';
import { TournamentHistorySection } from '@/features/mypage/components/TournamentHistorySection';
import { LetterboxTabs } from '@/features/mypage/components/LetterboxTabs';
import { RegionStampMap } from '@/features/region';
import { PageSection } from '@/components/ui';
import styles from './MyPageClient.module.scss';

/**
 * 마이페이지 컴포지션
 *
 * 컴포넌트 분할 (features/mypage/components):
 *   - <ProfileCard />              닉네임 + 유형 뱃지
 *   - <RegionStampMap />           도장깨기 (features/region 에서 import)
 *   - <SavedTournamentsSection />  저장된 우승지 (최대 10)
 *   - <TournamentHistorySection /> 토너먼트 기록 (InfiniteList)
 *   - <LetterboxTabs />            받은/좋아요/저장/보낸 (InfiniteList × 4)
 *
 * 계정 액션 (로그아웃 등)은 /settings 페이지로 이동.
 * 마이페이지 우상단에 "설정" 아이콘 링크 추가 가능.
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

      {/* 3) 도장깨기 */}
      <PageSection title={t('stampMap')}>
        <RegionStampMap />
      </PageSection>

      {/* 4) 저장된 우승지 */}
      <PageSection title={t('savedTournaments')}>
        <SavedTournamentsSection />
      </PageSection>

      {/* 5) 토너먼트 기록 */}
      <PageSection title={t('tournamentHistory')}>
        <TournamentHistorySection />
      </PageSection>

      {/* 6) 편지함 4탭 */}
      <PageSection title={t('letterbox')}>
        <LetterboxTabs />
      </PageSection>

      {/* 계정 관리는 /settings 페이지로 */}
      <Link href={ROUTES.SETTINGS} className={styles.settingsLink}>
        {t('goToSettings')}
      </Link>
    </div>
  );
}
