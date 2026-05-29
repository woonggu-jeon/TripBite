'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { RegionCode } from '@/constants/regions';
import type { RegionContentType } from '@/features/region/types';
import { useRegionContents } from '@/features/region/hooks/use-region';
import { InfiniteList } from '@/features/list/components/InfiniteList';
import { RegionContentRow } from '@/features/region/components/RegionContentRow';
import { haptic } from '@/lib/haptic';
import styles from './RegionDetailTabs.module.scss';

/**
 * 시군 상세 — 3탭 + InfiniteList + row 카드
 *
 *   ┌─────────────────────────────┐
 *   │ 관광지 │ 축제 │ 체험관광       │  segmented tabs
 *   ├─────────────────────────────┤
 *   │ [이모지] 제목                │
 *   │         한 줄 소개      ›    │  RegionContentRow × N
 *   │ ...                          │
 *   └─────────────────────────────┘
 */

const TABS: {
  key: RegionContentType;
  labelKey: 'attraction' | 'festival' | 'experience';
}[] = [
  { key: 'attraction', labelKey: 'attraction' },
  { key: 'festival', labelKey: 'festival' },
  { key: 'experience', labelKey: 'experience' },
];

export function RegionDetailTabs({ code }: { code: RegionCode }) {
  const t = useTranslations('region.tabs');
  const [tab, setTab] = useState<RegionContentType>('attraction');

  return (
    <div className={styles.wrap}>
      <div role="tablist" className={styles.tabs} aria-label={t('sectionAria')}>
        {TABS.map((it) => {
          const isActive = tab === it.key;
          return (
            <button
              key={it.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`${styles.tab} ${isActive ? styles.active : ''}`}
              onClick={() => {
                if (tab === it.key) return;
                haptic.tap();
                setTab(it.key);
              }}
            >
              {t(it.labelKey)}
            </button>
          );
        })}
      </div>

      <RegionContentPanel code={code} type={tab} />
    </div>
  );
}

function RegionContentPanel({
  code,
  type,
}: {
  code: RegionCode;
  type: RegionContentType;
}) {
  const t = useTranslations('region');
  const {
    items,
    hasNext,
    isFetchingNext,
    fetchNext,
    isLoading,
    error,
    refetch,
  } = useRegionContents(code, type);

  if (error) {
    return (
      <div className={styles.fallback}>
        <p>{t('listError')}</p>
        <button
          type="button"
          className={styles.retry}
          onClick={() => refetch()}
        >
          {t('listRetry')}
        </button>
      </div>
    );
  }

  const emptyKey = `empty.${type}` as const;
  return (
    <InfiniteList
      items={items}
      hasNext={hasNext}
      isFetchingNext={isFetchingNext || isLoading}
      onReachEnd={fetchNext}
      keyExtractor={(i) => i.id}
      renderItem={(i) => <RegionContentRow content={i} />}
      emptyState={<p className={styles.empty}>{t(emptyKey)}</p>}
    />
  );
}
