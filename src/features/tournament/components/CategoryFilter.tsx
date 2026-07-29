'use client';

import { useTranslations } from 'next-intl';
import type { DestinationCategory } from '@/api/generated/schemas';
import { RadioGroup, RadioOption } from '@/components/ui';
import styles from './CategoryFilter.module.scss';

const CATEGORIES: { value: DestinationCategory }[] = [
  { value: 'festival' },
  { value: 'attraction' },
  { value: 'experience' },
];

export interface CategoryFilterProps {
  value: DestinationCategory | null;
  onChange: (value: DestinationCategory) => void;
}

/**
 * 여행 유형 3종 — 세로 1열 3행 카드. 단일 선택.
 *
 * Figma "TRN · 카테고리 선택" (2026-06-22):
 *   big-card 320×81, padding 20, t5-text column gap 4.
 *   title B_14 fg + subtitle R_12 muted ("유명 관광 명소" 등).
 *   active: bg secondary01 + 1px primary border.
 *
 * 선택 즉시 부모로 onChange — 부모(TournamentSetup)에서 다음 step 자동 진행.
 */
export function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  const t = useTranslations('tournament');

  return (
    <RadioGroup
      label={t('setup.steps.category.ariaLabel')}
      className={styles.list}
    >
      {CATEGORIES.map((c) => {
        const active = value === c.value;
        return (
          <RadioOption
            key={c.value}
            checked={active}
            onSelect={() => onChange(c.value)}
            className={`${styles.row} ${active ? styles.active : ''}`}
          >
            <span className={styles.label}>{t(`category.${c.value}`)}</span>
            <span className={styles.desc}>{t(`categoryDesc.${c.value}`)}</span>
          </RadioOption>
        );
      })}
    </RadioGroup>
  );
}
