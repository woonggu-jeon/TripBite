'use client';

import { useTranslations } from 'next-intl';
import { cardClasses, RadioGroup, RadioOption } from '@/components/ui';
import type { Season } from '@/api/generated/schemas';
import styles from './SeasonSelector.module.scss';

const SEASONS: { value: Season; emoji: string }[] = [
  { value: 'spring', emoji: '🌸' },
  { value: 'summer', emoji: '🌊' },
  { value: 'autumn', emoji: '🍂' },
  { value: 'winter', emoji: '❄️' },
];

export interface SeasonSelectorProps {
  value: Season | null;
  onChange: (season: Season) => void;
}

/**
 * 토너먼트 2단계(계절 분기) — 봄/여름/가을/겨울 4지선택.
 * 2×2 그리드, 계절별 컬러 그라데이션.
 */
export function SeasonSelector({ value, onChange }: SeasonSelectorProps) {
  const t = useTranslations('tournament');

  return (
    <RadioGroup label={t('setup.steps.season.title')} className={styles.grid}>
      {SEASONS.map((s) => {
        const active = value === s.value;
        return (
          <RadioOption
            key={s.value}
            checked={active}
            onSelect={() => onChange(s.value)}
            className={cardClasses({
              variant: 'surface',
              className: `${styles.card} ${active ? styles.active : ''} ${styles[s.value] ?? ''}`,
            })}
          >
            <span className={styles.emoji} aria-hidden>
              {s.emoji}
            </span>
            <span className={styles.label}>{t(`season.${s.value}`)}</span>
          </RadioOption>
        );
      })}
    </RadioGroup>
  );
}
