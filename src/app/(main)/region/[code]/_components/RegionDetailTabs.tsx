'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { RegionCode } from '@/constants/regions';

type Tab = 'attraction' | 'festival' | 'experience';

/**
 * 시군 상세 — 탭 + InfiniteList
 *
 * 컴포넌트 분할 (features/region/components):
 *   - <RegionHero code={...} />            대표 이미지 (OptimizedImage priority)
 *   - <RegionAttractionList code={...} />  TourAPI contentTypeId=12 (관광지)
 *   - <RegionFestivalList code={...} />    TourAPI contentTypeId=15 (축제)
 *   - <RegionExperienceList code={...} />  TourAPI contentTypeId=28 (체험)
 *
 * 각 List 컴포넌트는 useInfiniteList + InfiniteList 조합 사용.
 */
export function RegionDetailTabs({ code }: { code: RegionCode }) {
  const t = useTranslations('region.tabs');
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('attraction');

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {/* TODO: <RegionHero code={code} /> */}
      <div
        style={{
          aspectRatio: '16 / 9',
          border: '1px dashed var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--color-muted)',
        }}
      >
        대표 이미지 (OptimizedImage priority)
      </div>

      {/* 탭 */}
      <div role="tablist" style={{ display: 'flex', gap: 8 }}>
        {(['attraction', 'festival', 'experience'] as const).map((key) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            style={{
              flex: 1,
              padding: '0.625rem',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              background: tab === key ? 'var(--color-fg)' : 'transparent',
              color: tab === key ? 'var(--color-bg)' : 'var(--color-fg)',
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            {t(key)}
          </button>
        ))}
      </div>

      {/* 탭별 InfiniteList — 컴포넌트 분기 */}
      <div role="tabpanel">
        {/* TODO: tab === 'attraction' && <RegionAttractionList code={code} /> 등 */}
        <div
          style={{
            minHeight: 240,
            border: '1px dashed var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            display: 'grid',
            placeItems: 'center',
            color: 'var(--color-muted)',
          }}
        >
          InfiniteList ({tab})
        </div>
      </div>

      {/* 하단 CTA */}
      <button
        type="button"
        style={{
          padding: '1rem',
          background: 'var(--color-primary)',
          color: 'var(--color-primary-fg)',
          borderRadius: 'var(--radius-md)',
          fontWeight: 600,
        }}
        onClick={() => {
          // TODO: useTournamentStore.getState().setConfig({ region: code, ... })
          router.push('/tournament');
        }}
      >
        {t('startTournamentHere')}
      </button>
    </div>
  );
}
