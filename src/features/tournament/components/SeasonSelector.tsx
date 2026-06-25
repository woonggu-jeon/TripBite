'use client';

import { useTranslations } from 'next-intl';
import {
  cardClasses,
  RadioGroup,
  RadioOption,
  SeasonIcon,
} from '@/components/ui';
import type { Season } from '@/api/generated/schemas';
import styles from './SeasonSelector.module.scss';

const SEASONS: { value: Season }[] = [
  { value: 'spring' },
  { value: 'summer' },
  { value: 'autumn' },
  { value: 'winter' },
];

export interface SeasonSelectorProps {
  value: Season | null;
  onChange: (season: Season) => void;
}

/**
 * 토너먼트 2단계(계절 분기) — 봄/여름/가을/겨울 4지선택.
 *
 * Figma "TRN · 계절 선택" (2026-06-22):
 *   2×2 grid, season-card 154×145 padding 20 10 gap 12.
 *   circle 56 + season color bg (봄 #FBE4E4 / 여름 #E0FF89 /
 *   가을 #FFCD99 / 겨울 #E9F0F9) + emoji 28.
 *   title B_14 + caption R_12 muted (월 범위).
 *   active: bg secondary01 + 1px primary border.
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
            <span className={styles.emojiCircle} aria-hidden>
              <SeasonIcon season={s.value} size={36} />
            </span>
            <span className={styles.t5Text}>
              <span className={styles.label}>{t(`season.${s.value}`)}</span>
              <span className={styles.sub}>{t(`seasonMonths.${s.value}`)}</span>
            </span>
          </RadioOption>
        );
      })}
    </RadioGroup>
  );
}
