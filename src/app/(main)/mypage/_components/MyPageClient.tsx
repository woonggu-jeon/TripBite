'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
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
 * 마이페이지 컴포지션 — Figma "MY_01" (2026-06-23) 정합.
 *
 * 컴포넌트 분할 (features/mypage/components):
 *   - <ProfileCard />              닉네임 + 카메라 변경 + badge
 *   - <StampBookBanner />          도장책 진입 배너 → /mypage/stamps
 *   - <SavedTournamentsSection />  저장된 우승지 (최대 20)
 *   - <TournamentHistorySection /> 최근 토너먼트
 *
 * 편지함 영역은 마이페이지에서 미노출 (요구사항). /letter 라우트는 유지.
 * 계정 액션 (로그아웃 등)은 /settings 페이지 — 헤더 우측 settings icon link
 * 가 진입점. mypage 본문의 "설정으로 이동" link 는 Figma 외 + 헤더 진입과
 * 중복 — 제거 (2026-06-23 사용자 요청).
 */
export function MyPageClient() {
  const t = useTranslations('mypage.sections');

  return (
    <div className={styles.grid}>
      {/* 1) 프로필 row — Figma "MY_01" pf frame — flat row, PageSection wrap
          없음 (header 바로 아래 자체 row + border-bottom). viewport 가장자리
          까지 bleed (Figma 360 풀너비). */}
      <ProfileCard />

      {/* 본문 sections 묶음 — viewport 가장자리에서 padding 으로 띄움 */}
      <div className={styles.body}>
        {/* 2) 도장책 — 배너 진입점. 전체 지도는 /mypage/stamps.
            sec-title 우측 "전체보기" Link 도 stamps 페이지로 (banner 자체
            click 과 동일 동작 — Figma "MY_01" sec-title 우측 Caption R_12
            muted slot). */}
        <PageSection
          title={t('stampMap')}
          action={
            <Link
              href="/mypage/stamps"
              prefetch={false}
              className={styles.sectionViewAll}
            >
              <span>{t('stampMapViewAll')}</span>
              <ChevronRight size={14} aria-hidden />
            </Link>
          }
        >
          <StampBookBanner />
        </PageSection>

        {/* 3) 저장된 우승지 — 가로 스크롤 Carousel + 헤더 우측 "전체보기 (N)" Link */}
        <PageSection
          title={t('savedTournaments')}
          action={<SavedTournamentsViewAll />}
        >
          <SavedTournamentsSection />
        </PageSection>

        {/* 4) 최근 토너먼트 */}
        <PageSection title={t('tournamentHistory')}>
          <TournamentHistorySection />
        </PageSection>
      </div>
    </div>
  );
}
