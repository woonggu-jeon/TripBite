'use client';

import { useTranslations } from 'next-intl';
import { RadioGroup, RadioOption } from '@/components/ui';
import type { DestinationCategory } from '@/api/generated/schemas';
import styles from './CategoryFilter.module.scss';

const CATEGORIES: { value: DestinationCategory; emoji: string }[] = [
  { value: 'festival', emoji: '🎪' },
  { value: 'attraction', emoji: '📍' },
  { value: 'experience', emoji: '🎨' },
];

export interface CategoryFilterProps {
  value: DestinationCategory | null;
  onChange: (value: DestinationCategory) => void;
}

/**
 * 여행 유형 3종 — 세로 1열 3행 카드. 단일 선택.
 * 선택 즉시 부모로 onChange — 부모(TournamentSetup)에서 다음 step 자동 진행.
 */
export function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  const t = useTranslations('tournament');

  return (
    <RadioGroup label={t('setup.steps.category.title')} className={styles.list}>
      {CATEGORIES.map((c) => {
        const active = value === c.value;
        return (
          <RadioOption
            key={c.value}
            checked={active}
            onSelect={() => onChange(c.value)}
            className={`${styles.row} ${active ? styles.active : ''}`}
          >
            <span className={styles.emoji} aria-hidden>
              {c.emoji}
            </span>
            <span className={styles.label}>{t(`category.${c.value}`)}</span>
            <span className={styles.check} aria-hidden>
              {active ? '✓' : ''}
            </span>
          </RadioOption>
        );
      })}
    </RadioGroup>
  );
}
