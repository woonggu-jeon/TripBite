'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';

/**
 * 랭킹 페이지 콘텐츠 (사이트맵 v2)
 *
 * 섹션:
 *   1) 이번주 우승 TOP 5     (RankingList type=weekly-winners)
 *   2) 추천 TOP 5            (RankingList type=recommended — TourAPI 인기순)
 *   3) 숨은 명소 TOP 5       (RankingList type=hidden-gems — 평점높음+조회수낮음)
 *   4) 시군별 인기 차트       (BarChart — 11개 시군 막대)
 *   5) 여행 유형 테스트 진입  → /quiz 로 이동
 *
 * 성능:
 *   - 각 RankingList는 자체 useQuery (parallel)
 *   - BarChart는 동적 import (이미 wrapper에서 처리)
 *   - 이 페이지는 client component지만 데이터는 hooks로 분리되어 streaming 가능
 */
export function RankingPageContent() {
  const t = useTranslations('ranking.sections');

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {/* 1) 이번주 우승 TOP 5 */}
      <section>
        <h2 style={titleStyle}>{t('weeklyWinners', { limit: 5 })}</h2>
        {/* TODO: <RankingList type="weekly-winners" limit={5} /> */}
        <Placeholder height={300} />
      </section>

      {/* 2) 추천 TOP 5 */}
      <section>
        <h2 style={titleStyle}>{t('recommended', { limit: 5 })}</h2>
        {/* TODO: <RankingList type="recommended" limit={5} /> */}
        <Placeholder height={300} />
      </section>

      {/* 3) 숨은 명소 TOP 5 */}
      <section>
        <h2 style={titleStyle}>{t('hiddenGems', { limit: 5 })}</h2>
        {/* TODO: <RankingList type="hidden-gems" limit={5} />
                  - 백엔드 로직: 평점 높음 AND 조회수/우승수 적음
                  - 사용자가 새로운 발견을 할 수 있도록 큐레이션 */}
        <Placeholder height={300} />
      </section>

      {/* 4) 시군별 인기 차트 (BarChart) */}
      <section>
        <h2 style={titleStyle}>{t('byRegionChart')}</h2>
        {/* TODO:
              import { BarChart } from '@/features/chart';
              const { data } = useRegionPopularity(); // 11개 시군 인기도
              <BarChart
                data={data ?? []}
                series={[{ key: 'wins', label: t('wins') }]}
                xAxis={{ dataKey: 'region', type: 'category' }}
                height={220}
              /> */}
        <Placeholder height={220} note="BarChart" />
      </section>

      {/* 5) 여행 유형 테스트 진입 */}
      <Link
        href={ROUTES.QUIZ}
        style={{
          padding: '1.25rem',
          background: 'var(--color-primary)',
          color: 'var(--color-primary-fg)',
          borderRadius: 'var(--radius-lg)',
          textAlign: 'center',
          fontWeight: 600,
        }}
      >
        {t('travelTypeTest')} →
      </Link>
    </div>
  );
}

const titleStyle: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: 700,
  marginBottom: '0.75rem',
};

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
        fontSize: '0.875rem',
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
