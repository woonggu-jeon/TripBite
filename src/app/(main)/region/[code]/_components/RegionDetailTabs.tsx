'use client';

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import type { RegionCode } from '@/constants/regions';
import type { RegionContentType } from '@/features/region/types';
import {
  regionKeys,
  useRegionContents,
} from '@/features/region/hooks/use-region';
import { regionApi } from '@/features/region/api/region';
import { InfiniteList } from '@/features/list/components/InfiniteList';
import { RegionContentRow } from '@/features/region/components/RegionContentRow';
import { TabList, Tab, TabPanel } from '@/components/ui';
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
 *
 * 깜빡임 방지 전략 ([[rendering-speed-first]] 정책 준수):
 *   1) **mount 유지 + lazy fetch** — 한번 클릭된 탭만 panel mount, 그 후
 *      탭 왕복 시 unmount/remount 없음. 두번째부터 캐시 hit 으로 즉시.
 *   2) **pointerdown / focus prefetch** — 모바일 터치 다운 ~ 클릭 발사
 *      (100-250ms) 와 키보드 focus 시점에 미리 fetch 시작 → 첫 클릭의
 *      skeleton 노출 시간 단축. "처음부터 다 fetch" 가 아니라 explicit
 *      interaction 시작 trigger 라 정책 부합.
 *   3) **min-height** — panel 영역 고정 높이 → skeleton → data 전환 시 CLS 0.
 *      skeleton row 높이(80) = RegionContentRow 실제 높이(~83) 와 매칭.
 *
 * 직전 탭 데이터를 placeholder 로 유지하는 방식(keepPreviousData)은
 * "festival 눌렀는데 attraction 데이터가 보임" 정보 오인 위험으로 제외.
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
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<RegionContentType>('attraction');
  // 한번이라도 활성화된 탭만 panel mount. 초기엔 'attraction' 만.
  const [activated, setActivated] = useState<Set<RegionContentType>>(
    () => new Set(['attraction']),
  );

  const prefetchTab = useCallback(
    (type: RegionContentType) => {
      if (activated.has(type)) return; // 이미 mount 중이면 중복 호출 X
      queryClient.prefetchInfiniteQuery({
        queryKey: regionKeys.contents(code, type),
        queryFn: ({ pageParam }) =>
          regionApi.listContents(code, {
            type,
            cursor: pageParam as string | number | null,
            limit: 10,
          }),
        initialPageParam: null as string | number | null,
      });
    },
    [activated, code, queryClient],
  );

  const selectTab = (next: RegionContentType) => {
    if (tab === next) return;
    if (!activated.has(next)) {
      setActivated((s) => new Set(s).add(next));
    }
    setTab(next);
  };

  return (
    <div className={styles.wrap}>
      <TabList ariaLabel={t('sectionAria')} className={styles.tabs}>
        {TABS.map((it) => {
          const isActive = tab === it.key;
          return (
            <Tab
              key={it.key}
              id={`region-${it.key}`}
              selected={isActive}
              onSelect={() => selectTab(it.key)}
              onPrefetch={() => prefetchTab(it.key)}
              className={`${styles.tab} ${isActive ? styles.active : ''}`}
            >
              {t(it.labelKey)}
            </Tab>
          );
        })}
      </TabList>

      <div className={styles.panelArea}>
        {TABS.map((it) => (
          <TabPanel
            key={it.key}
            id={`region-${it.key}`}
            selected={tab === it.key}
            mounted={activated.has(it.key)}
            className={styles.panel}
          >
            <RegionContentPanel code={code} type={it.key} />
          </TabPanel>
        ))}
      </div>
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
      columns={2}
    />
  );
}
