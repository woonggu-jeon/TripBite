'use client';

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { LetterListPanel } from '@/features/letter/components/LetterListPanel';
import { letterApi } from '@/features/letter/api/letter';
import { letterKeys } from '@/features/letter/hooks/use-letters';
import type { LetterListKind } from '@/features/letter/types';
import { haptic } from '@/lib/haptic';
import styles from './LetterboxTabs.module.scss';

/**
 * 마이페이지 편지함 4탭 — received / liked / saved / sent.
 *
 * `LetterIndex` (편지 메인) 의 탭 패턴 재사용:
 *   - mount 유지 + lazy fetch (한번 활성화된 탭만 panel mount)
 *   - pointerdown / focus prefetch (모바일 touch 다운 ~ 클릭 사이 latency 흡수)
 *   - min-height (CLS 0)
 *   - ARIA 1.2 tabpanel + aria-labelledby + aria-controls 페어링
 *
 * 마이페이지에서는 받은(received) → 좋아요(liked) → 저장(saved) → 보낸(sent)
 * 순서로 노출 (사용자 흐름: 받은 편지부터 확인 → 좋아요/저장한 편지 회상 → 보낸).
 */
const TABS: { key: LetterListKind; labelKey: LetterListKind }[] = [
  { key: 'received', labelKey: 'received' },
  { key: 'liked', labelKey: 'liked' },
  { key: 'saved', labelKey: 'saved' },
  { key: 'sent', labelKey: 'sent' },
];

const FETCHERS = {
  received: letterApi.listReceived,
  liked: letterApi.listLiked,
  saved: letterApi.listSaved,
  sent: letterApi.listSent,
} as const;

export function LetterboxTabs() {
  const t = useTranslations('letter.tabs');
  const queryClient = useQueryClient();
  const [active, setActive] = useState<LetterListKind>('received');
  const [activated, setActivated] = useState<Set<LetterListKind>>(
    () => new Set(['received']),
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
    haptic.tap();
    if (!activated.has(next)) {
      setActivated((s) => new Set(s).add(next));
    }
    setActive(next);
  };

  return (
    <div>
      <div className={styles.tabs} role="tablist" aria-label={t('section')}>
        {TABS.map((tab) => {
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              id={`mypage-letter-tab-${tab.key}`}
              aria-selected={isActive}
              aria-controls={`mypage-letter-panel-${tab.key}`}
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
              id={`mypage-letter-panel-${tab.key}`}
              aria-labelledby={`mypage-letter-tab-${tab.key}`}
              hidden={!isActive}
              className={styles.panel}
            >
              <LetterListPanel kind={tab.key} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
