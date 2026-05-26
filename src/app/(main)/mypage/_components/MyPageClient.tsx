'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';

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
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {/* 1) 프로필 */}
      <Section title={t('profile')}>
        {/* TODO: <ProfileCard /> */}
        <Placeholder height={120} />
      </Section>

      {/* 2) 도장깨기 */}
      <Section title={t('stampMap')}>
        {/* TODO: <RegionStampMap /> from @/features/region */}
        <Placeholder height={280} note="ChungbukSvgMap + stamps" />
      </Section>

      {/* 3) 저장된 우승지 */}
      <Section title={t('savedTournaments')}>
        {/* TODO: <SavedTournamentsSection />
                  - 최대 10개
                  - 가로 캐러셀 권장 (slidesPerView 2.2) */}
        <Placeholder height={180} />
      </Section>

      {/* 4) 토너먼트 기록 (InfiniteList) */}
      <Section title={t('tournamentHistory')}>
        {/* TODO: <TournamentHistorySection /> — useInfiniteList */}
        <Placeholder height={200} note="InfiniteList" />
      </Section>

      {/* 5) 편지함 4탭 */}
      <Section title={t('letterbox')}>
        {/* TODO: <LetterboxTabs />
                  - 탭: received / liked / saved / sent
                  - 각각 useInfiniteList + InfiniteList */}
        <Placeholder height={240} note="InfiniteList × 4 tabs" />
      </Section>

      {/* 계정 관리는 /settings 페이지로 */}
      <Link
        href={ROUTES.SETTINGS}
        style={{
          padding: '0.875rem 1rem',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          textAlign: 'center',
          fontSize: '0.875rem',
          fontWeight: 500,
        }}
      >
        {t('goToSettings')}
      </Link>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Placeholder({ height, note }: { height: number; note?: string }) {
  return (
    <div
      style={{
        height,
        border: '1px dashed var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        display: 'grid',
        placeItems: 'center',
        color: 'var(--color-muted)',
        fontSize: '0.8125rem',
        gap: 4,
      }}
    >
      {note && (
        <span
          style={{
            padding: '2px 6px',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.6875rem',
          }}
        >
          {note}
        </span>
      )}
    </div>
  );
}
