'use client';

import { useTranslations } from 'next-intl';
import { haptic } from '@/lib/haptic';
import type { Season, TournamentTheme } from '@/features/tournament/types';
import styles from './ThemeSelector.module.scss';

/**
 * 계절(2×2) + 기념일(단독 와이드 카드) 5지선택.
 *
 * 특별한 날 타입은 birthday/anniversary 두 종이지만, UX 단순화를 위해
 * 일단 'anniversary' 한 종만 노출. 추후 분리 가능.
 */
const SEASONS: { value: Season; emoji: string }[] = [
  { value: 'spring', emoji: '🌸' },
  { value: 'summer', emoji: '🌊' },
  { value: 'autumn', emoji: '🍂' },
  { value: 'winter', emoji: '❄️' },
];

export interface ThemeSelectorProps {
  value: TournamentTheme | null;
  onChange: (theme: TournamentTheme) => void;
}

export function ThemeSelector({ value, onChange }: ThemeSelectorProps) {
  const t = useTranslations('tournament');

  const pickSeason = (s: Season) => {
    haptic.tap();
    onChange({ kind: 'season', value: s });
  };
  const pickAnniversary = () => {
    haptic.tap();
    onChange({ kind: 'special', value: 'anniversary' });
  };

  const isSeason = (s: Season) => value?.kind === 'season' && value.value === s;
  const isAnniv = value?.kind === 'special' && value.value === 'anniversary';

  return (
    <div
      className={styles.wrap}
      role="radiogroup"
      aria-label={t('setup.themeSection')}
    >
      <div className={styles.grid}>
        {SEASONS.map((s) => {
          const active = isSeason(s.value);
          return (
            <button
              key={s.value}
              type="button"
              role="radio"
              aria-checked={active}
              className={`${styles.card} ${active ? styles.active : ''} ${styles[s.value] ?? ''}`}
              onClick={() => pickSeason(s.value)}
            >
              <span className={styles.emoji} aria-hidden>
                {s.emoji}
              </span>
              <span className={styles.label}>{t(`season.${s.value}`)}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        role="radio"
        aria-checked={isAnniv}
        className={`${styles.cardWide} ${isAnniv ? styles.active : ''}`}
        onClick={pickAnniversary}
      >
        <span className={styles.emoji} aria-hidden>
          🎉
        </span>
        <span className={styles.label}>{t('specialDay.anniversary')}</span>
      </button>
    </div>
  );
}
