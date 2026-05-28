'use client';

import { useTranslations } from 'next-intl';
import { haptic } from '@/lib/haptic';
import type { Season } from '@/features/tournament/types';
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

  const pick = (s: Season) => {
    haptic.tap();
    onChange(s);
  };

  return (
    <div
      className={styles.grid}
      role="radiogroup"
      aria-label={t('setup.steps.season.title')}
    >
      {SEASONS.map((s) => {
        const active = value === s.value;
        return (
          <button
            key={s.value}
            type="button"
            role="radio"
            aria-checked={active}
            className={`${styles.card} ${active ? styles.active : ''} ${styles[s.value] ?? ''}`}
            onClick={() => pick(s.value)}
          >
            <span className={styles.emoji} aria-hidden>
              {s.emoji}
            </span>
            <span className={styles.label}>{t(`season.${s.value}`)}</span>
          </button>
        );
      })}
    </div>
  );
}
