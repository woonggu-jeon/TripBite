'use client';

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { CHUNGBUK_REGIONS, type RegionCode } from '@/constants/regions';
import { toneFor } from '@/constants/region-tone';
import type {
  DestinationCategory,
  RegionContentDto,
} from '@/api/generated/schemas';
import {
  regionKeys,
  useRegionContents,
} from '@/features/region/hooks/use-region';
import {
  regionApi,
  type RegionContentFilter,
} from '@/features/region/api/region';
import { InfiniteList } from '@/features/list/components/InfiniteList';
import { DestinationCard, TabList, Tab, TabPanel } from '@/components/ui';
import styles from './RegionDetailTabs.module.scss';

/**
 * 시군 상세 — 3탭 + InfiniteList + row 카드
 *
 *   ┌─────────────────────────────────┐
 *   │ 전체 │ 관광지 │ 축제 │ 체험관광   │  segmented tabs (전체 = BE 'all')
 *   ├─────────────────────────────────┤
 *   │ ┌──────┐ ┌──────┐                │
 *   │ │이미지│ │이미지│                │
 *   │ │ 제목 │ │ 제목 │   DestinationCard × N (columns={2})
 *   │ │ 설명 │ │ 설명 │   summary 있으면 한 줄 ellipsis
 *   │ └──────┘ └──────┘                │
 *   └─────────────────────────────────┘
 *
 * 깜빡임 방지 전략 ([[rendering-speed-first]] 정책 준수):
 *   1) **mount 유지 + lazy fetch** — 한번 클릭된 탭만 panel mount, 그 후
 *      탭 왕복 시 unmount/remount 없음. 두번째부터 캐시 hit 으로 즉시.
 *   2) **pointerdown / focus prefetch** — 모바일 터치 다운 ~ 클릭 발사
 *      (100-250ms) 와 키보드 focus 시점에 미리 fetch 시작 → 첫 클릭의
 *      skeleton 노출 시간 단축. "처음부터 다 fetch" 가 아니라 explicit
 *      interaction 시작 trigger 라 정책 부합.
 *   3) **min-height** — panel 영역 고정 높이 → skeleton → data 전환 시 CLS 0.
 *      DestinationCard 2 columns × 2 rows ≈ 460px 와 매칭 (scss).
 *
 * 직전 탭 데이터를 placeholder 로 유지하는 방식(keepPreviousData)은
 * "festival 눌렀는데 attraction 데이터가 보임" 정보 오인 위험으로 제외.
 */

/**
 * 'all' 은 응답 enum (`DestinationCategory`) 가 아니라 "필터 없음" 쿼리값 —
 * `RegionContentFilter` (api/region.ts) 에서 분리 union 으로 정의. FE 는 'all'
 * 시 BE 에 `type` 파라미터 omit 으로 전달 (BE region.service 가 미지정/unknown
 * type 시 필터 미적용 → 통합 응답).
 *
 * BE OpenAPI 후속 (선택): `@ApiQuery({ enum: ['all', ...DestinationCategory] })`
 * 로 query-level enum 만 분리. 응답 enum 은 3값 유지 → 마이그레이션 0.
 */
const TABS: {
  key: RegionContentFilter;
  labelKey: 'all' | 'attraction' | 'festival' | 'experience';
}[] = [
  { key: 'all', labelKey: 'all' },
  { key: 'attraction', labelKey: 'attraction' },
  { key: 'festival', labelKey: 'festival' },
  { key: 'experience', labelKey: 'experience' },
];

const TYPE_EMOJI: Record<DestinationCategory, string> = {
  attraction: '📍',
  festival: '🎪',
  experience: '🎨',
};

const ALL_EMOJI = '🗺️';

function regionLabel(code: RegionCode): string {
  return CHUNGBUK_REGIONS.find((r) => r.code === code)?.ko ?? code;
}

export function RegionDetailTabs({ code }: { code: RegionCode }) {
  const t = useTranslations('region.tabs');
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<RegionContentFilter>('all');
  // 한번이라도 활성화된 탭만 panel mount. 초기엔 'all' 만.
  const [activated, setActivated] = useState<Set<RegionContentFilter>>(
    () => new Set(['all']),
  );

  const prefetchTab = useCallback(
    (type: RegionContentFilter) => {
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

  const selectTab = (next: RegionContentFilter) => {
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
  type: RegionContentFilter;
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

  // 'all' 탭은 통합이라 빈 응답 시 일반 empty 메시지 (관광지 기준 문구 재활용).
  const emptyKey = (type === 'all' ? 'empty.attraction' : `empty.${type}`) as
    | 'empty.attraction'
    | 'empty.festival'
    | 'empty.experience';
  const tone = toneFor(code);
  const label = regionLabel(code);

  return (
    <InfiniteList
      items={items}
      hasNext={hasNext}
      isFetchingNext={isFetchingNext || isLoading}
      onReachEnd={fetchNext}
      keyExtractor={(i) => i.id}
      renderItem={(i: RegionContentDto) => (
        <DestinationCard
          href={{ pathname: `/destination/${i.id}` }}
          imageUrl={i.imageUrl}
          // 'all' 탭이라도 응답 item 의 type 은 항상 attraction|festival|experience.
          emoji={TYPE_EMOJI[i.type] ?? ALL_EMOJI}
          tone={tone}
          regionLabel={label}
          name={i.title}
          description={i.summary}
        />
      )}
      emptyState={<p className={styles.empty}>{t(emptyKey)}</p>}
      columns={2}
    />
  );
}
