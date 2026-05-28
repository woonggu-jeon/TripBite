'use client';

import { useTranslations } from 'next-intl';
import { haptic } from '@/lib/haptic';
import type { TournamentCount } from '@/features/tournament/types';
import styles from './CountSelector.module.scss';

const COUNTS: TournamentCount[] = [4, 8, 16, 32];

export interface CountSelectorProps {
  value: TournamentCount | null;
  onChange: (value: TournamentCount) => void;
}

export function CountSelector({ value, onChange }: CountSelectorProps) {
  const t = useTranslations('tournament.setup');

  const pick = (c: TournamentCount) => {
    haptic.tap();
    onChange(c);
  };

  return (
    <div
      className={styles.row}
      role="radiogroup"
      aria-label={t('countSection')}
    >
      {COUNTS.map((c) => {
        const active = value === c;
        return (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={active}
            className={`${styles.card} ${active ? styles.active : ''}`}
            onClick={() => pick(c)}
          >
            <span className={styles.num}>{c}</span>
            <span className={styles.label}>{t(`count.${c}`)}</span>
          </button>
        );
      })}
    </div>
  );
}
