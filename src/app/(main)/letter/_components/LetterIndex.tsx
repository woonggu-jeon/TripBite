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
import styles from './LetterIndex.module.scss';

/**
 * /letter 메인 — Figma "편지 메인" (2026-06-24).
 *
 * 구조:
 *   - mb (banner wrap padding 20) — ComposeEntryCard 320×147.
 *   - seg (3 탭 360×44) — 받은 / 좋아요 / 보낸 (Figma 순서).
 *     · 활성: border-bottom primary + B_14 fg.
 *     · 비활성: border-bottom gray + R_14 muted.
 *   - ml (mail list padding 20 gap 12) 또는 ec (empty state).
 *
 * 깜빡임 방지 — RegionDetailTabs 와 동일 전략:
 *   1) 한번 클릭된 탭만 panel mount + hidden 토글.
 *   2) pointerdown / focus prefetch — 터치 다운 latency 흡수.
 *   3) ml min-height — CLS 0.
 */
const TABS: { key: LetterListKind; labelKey: 'received' | 'liked' | 'sent' }[] =
  [
    { key: 'received', labelKey: 'received' },
    { key: 'liked', labelKey: 'liked' },
    { key: 'sent', labelKey: 'sent' },
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
  const searchParams = useSearchParams();
  const initial = readInitialTab(searchParams.get('tab'));
  const [active, setActive] = useState<LetterListKind>(initial);
  const [activated, setActivated] = useState<Set<LetterListKind>>(
    () => new Set([initial]),
  );

  const prefetchTab = useCallback(
    (kind: LetterListKind) => {
      if (activated.has(kind)) return;
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
      <div className={styles.mb}>
        <ComposeEntryCard />
      </div>

      <div className={styles.seg} role="tablist" aria-label={t('section')}>
        {TABS.map((tab) => {
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`letter-panel-${tab.key}`}
              id={`letter-tab-${tab.key}`}
              tabIndex={isActive ? 0 : -1}
              className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
              onClick={() => selectTab(tab.key)}
              onPointerDown={() => prefetchTab(tab.key)}
              onFocus={() => prefetchTab(tab.key)}
            >
              {t(tab.labelKey)}
            </button>
          );
        })}
      </div>

      <div>
        {TABS.map((tab) => (
          <div
            key={tab.key}
            id={`letter-panel-${tab.key}`}
            role="tabpanel"
            aria-labelledby={`letter-tab-${tab.key}`}
            hidden={active !== tab.key}
            className={styles.panel}
          >
            {activated.has(tab.key) && <LetterListPanel kind={tab.key} />}
          </div>
        ))}
      </div>
    </div>
  );
}
