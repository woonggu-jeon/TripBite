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
  values: DestinationCategory[];
  onChange: (values: DestinationCategory[]) => void;
}

/**
 * 여행 유형 4종 — 세로 1열 4행 카드. 다중 선택.
 */
export function CategoryFilter({ values, onChange }: CategoryFilterProps) {
  const t = useTranslations('tournament');

  const toggle = (c: DestinationCategory) => {
    haptic.tap();
    onChange(
      values.includes(c) ? values.filter((v) => v !== c) : [...values, c],
    );
  };

  return (
    <div
      className={styles.list}
      role="group"
      aria-label={t('setup.steps.category.title')}
    >
      {CATEGORIES.map((c) => {
        const active = values.includes(c.value);
        return (
          <button
            key={c.value}
            type="button"
            aria-pressed={active}
            className={`${styles.row} ${active ? styles.active : ''}`}
            onClick={() => toggle(c.value)}
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
