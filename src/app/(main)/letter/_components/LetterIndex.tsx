'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ComposeEntryCard } from '@/features/letter/components/ComposeEntryCard';
import { LetterListPanel } from '@/features/letter/components/LetterListPanel';
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
 */
const TABS: { key: LetterListKind; labelKey: 'received' | 'sent' | 'liked' }[] =
  [
    { key: 'received', labelKey: 'received' },
    { key: 'sent', labelKey: 'sent' },
    { key: 'liked', labelKey: 'liked' },
  ];

export function LetterIndex() {
  const t = useTranslations('letter.tabs');
  const [active, setActive] = useState<LetterListKind>('received');

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
                aria-selected={isActive}
                className={`${styles.tab} ${isActive ? styles.active : ''}`}
                onClick={() => {
                  if (active !== tab.key) {
                    haptic.tap();
                    setActive(tab.key);
                  }
                }}
              >
                {t(tab.labelKey)}
              </button>
            );
          })}
        </div>

        <div className={styles.list}>
          {/* 활성 탭만 mount + fetch — 첫 렌더 속도 우선 (메모리 정책).
              깜빡임은 LetterListPanel min-height + skeleton 제어로 완화. */}
          <LetterListPanel kind={active} />
        </div>
      </section>
    </div>
  );
}
