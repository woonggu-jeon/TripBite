'use client';

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ComposeEntryCard } from '@/features/letter/components/ComposeEntryCard';
import { LetterListPanel } from '@/features/letter/components/LetterListPanel';
import { letterKeys } from '@/features/letter/hooks/use-letters';
import { letterApi } from '@/features/letter/api/letter';
import type { LetterListKind } from '@/features/letter/types';
import { haptic } from '@/lib/haptic';
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

export function LetterIndex() {
  const t = useTranslations('letter.tabs');
  const queryClient = useQueryClient();
  const [active, setActive] = useState<LetterListKind>('received');
  // 한번이라도 활성화된 탭만 panel mount. 초기엔 'received' 만.
  const [activated, setActivated] = useState<Set<LetterListKind>>(
    () => new Set(['received']),
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
    haptic.tap();
    if (!activated.has(next)) {
      setActivated((s) => new Set(s).add(next));
    }
    setActive(next);
  };

  return (
    <div className={styles.wrap}>
      <ComposeEntryCard />

      <section aria-label={t('section')}>
        <div className={styles.tabs} role="tablist" aria-label={t('section')}>
          {TABS.map((tab) => {
            const isActive = active === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                id={`letter-tab-${tab.key}`}
                aria-selected={isActive}
                aria-controls={`letter-panel-${tab.key}`}
                className={`${styles.tab} ${isActive ? styles.active : ''}`}
                onClick={() => selectTab(tab.key)}
                onPointerDown={() => prefetchTab(tab.key)}
                onFocus={() => prefetchTab(tab.key)}
              >
                {t(tab.labelKey)}
              </button>
            );
          })}
        </div>

        <div className={styles.list}>
          {TABS.map((tab) => {
            if (!activated.has(tab.key)) return null;
            const isActive = active === tab.key;
            return (
              <div
                key={tab.key}
                role="tabpanel"
                id={`letter-panel-${tab.key}`}
                aria-labelledby={`letter-tab-${tab.key}`}
                hidden={!isActive}
                className={styles.panel}
              >
                <LetterListPanel kind={tab.key} />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
