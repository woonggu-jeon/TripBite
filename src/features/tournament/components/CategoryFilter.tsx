'use client';

import { useTranslations } from 'next-intl';
import { haptic } from '@/lib/haptic';
import type { DestinationCategory } from '@/features/tournament/types';
import styles from './CategoryFilter.module.scss';

const CATEGORIES: { value: DestinationCategory; emoji: string }[] = [
  { value: 'local', emoji: '🏘️' },
  { value: 'festival', emoji: '🎪' },
  { value: 'attraction', emoji: '📍' },
  { value: 'experience', emoji: '🎨' },
];

export interface CategoryFilterProps {
  value: DestinationCategory | null;
  onChange: (value: DestinationCategory) => void;
}

/**
 * 여행 유형 4종 — 세로 1열 4행 카드. 단일 선택.
 * 선택 즉시 부모로 onChange — 부모(TournamentSetup)에서 다음 step 자동 진행.
 */
export function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  const t = useTranslations('tournament');

  const pick = (c: DestinationCategory) => {
    haptic.tap();
    onChange(c);
  };

  return (
    <div
      className={styles.list}
      role="radiogroup"
      aria-label={t('setup.steps.category.title')}
    >
      {CATEGORIES.map((c) => {
        const active = value === c.value;
        return (
          <button
            key={c.value}
            type="button"
            role="radio"
            aria-checked={active}
            className={`${styles.row} ${active ? styles.active : ''}`}
            onClick={() => pick(c.value)}
          >
            <span className={styles.emoji} aria-hidden>
              {c.emoji}
            </span>
            <span className={styles.label}>{t(`category.${c.value}`)}</span>
            <span className={styles.check} aria-hidden>
              {active ? '✓' : ''}
            </span>
          </button>
        );
      })}
    </div>
  );
}
