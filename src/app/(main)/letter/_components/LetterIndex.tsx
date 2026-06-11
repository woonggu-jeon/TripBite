'use client';

import { useCallback, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ComposeEntryCard } from '@/features/letter/components/ComposeEntryCard';
import { LetterListPanel } from '@/features/letter/components/LetterListPanel';
import { letterKeys } from '@/features/letter/hooks/use-letters';
import { letterApi } from '@/features/letter/api/letter';
import type { LetterListKind } from '@/features/letter/types';
import { TabList, Tab, TabPanel } from '@/components/ui';
import styles from './LetterIndex.module.scss';

/**
 * /letter 메인
 *
 *   ┌────────────────────────────┐
 *   │ ComposeEntryCard (hero)    │ ← 편지 보내러 가기
 *   ├────────────────────────────┤
 *   │ 받은 · 보낸 · 하트 (탭)     │
 *   ├────────────────────────────┤
 *   │ LetterRowCard × N          │ ← InfiniteList (useLettersInfinite)
 *   └────────────────────────────┘
 *
 * 깜빡임 방지 (RegionDetailTabs 와 동일 전략 — [[rendering-speed-first]]):
 *   1) mount 유지 + lazy fetch — 한번 클릭된 탭만 panel mount, hidden 토글
 *   2) pointerdown / focus prefetch — 터치 다운 ~ 클릭 사이 latency 흡수
 *   3) min-height — list 영역 고정 → CLS 0
 */
const TABS: { key: LetterListKind; labelKey: 'received' | 'sent' | 'liked' }[] =
  [
    { key: 'received', labelKey: 'received' },
    { key: 'sent', labelKey: 'sent' },
    { key: 'liked', labelKey: 'liked' },
  ];

const FETCHERS = {
  received: letterApi.listReceived,
  sent: letterApi.listSent,
  liked: letterApi.listLiked,
  saved: letterApi.listSaved,
} as const;

const VALID_TABS = new Set<LetterListKind>(['received', 'sent', 'liked']);

function readInitialTab(value: string | null): LetterListKind {
  return value && VALID_TABS.has(value as LetterListKind)
    ? (value as LetterListKind)
    : 'received';
}

export function LetterIndex() {
  const t = useTranslations('letter.tabs');
  const queryClient = useQueryClient();
  // 알림 / deep-link 에서 `?tab=sent|liked` 으로 직접 진입 가능 — 초기 active 분기.
  const searchParams = useSearchParams();
  const initial = readInitialTab(searchParams.get('tab'));
  const [active, setActive] = useState<LetterListKind>(initial);
  // 한번이라도 활성화된 탭만 panel mount. 초기엔 initial 탭만.
  const [activated, setActivated] = useState<Set<LetterListKind>>(
    () => new Set([initial]),
  );

  const prefetchTab = useCallback(
    (kind: LetterListKind) => {
      if (activated.has(kind)) return; // 이미 mount 중이면 중복 호출 X
      queryClient.prefetchInfiniteQuery({
        queryKey: letterKeys.list(kind),
        queryFn: ({ pageParam = 0 }) => FETCHERS[kind](pageParam as number),
        initialPageParam: 0 as number,
      });
    },
    [activated, queryClient],
  );

  const selectTab = (next: LetterListKind) => {
    if (active === next) return;
    if (!activated.has(next)) {
      setActivated((s) => new Set(s).add(next));
    }
    setActive(next);
  };

  return (
    <div className={styles.wrap}>
      <ComposeEntryCard />

      <section aria-label={t('section')}>
        <TabList ariaLabel={t('section')} className={styles.tabs}>
          {TABS.map((tab) => {
            const isActive = active === tab.key;
            return (
              <Tab
                key={tab.key}
                id={`letter-${tab.key}`}
                selected={isActive}
                onSelect={() => selectTab(tab.key)}
                onPrefetch={() => prefetchTab(tab.key)}
                className={`${styles.tab} ${isActive ? styles.active : ''}`}
              >
                {t(tab.labelKey)}
              </Tab>
            );
          })}
        </TabList>

        <div className={styles.list}>
          {TABS.map((tab) => (
            <TabPanel
              key={tab.key}
              id={`letter-${tab.key}`}
              selected={active === tab.key}
              mounted={activated.has(tab.key)}
              className={styles.panel}
            >
              <LetterListPanel kind={tab.key} />
            </TabPanel>
          ))}
        </div>
      </section>
    </div>
  );
}
