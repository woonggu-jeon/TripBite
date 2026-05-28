'use client';

import { useTranslations } from 'next-intl';
import { haptic } from '@/lib/haptic';
import {
  DESTINATION_COUNT_OPTIONS,
  TOURNAMENT_SIZE_OPTIONS,
  type TournamentCount,
} from '@/features/tournament/types';
import styles from './CountSelector.module.scss';

/**
 * 2×2 그리드 갯수 선택. 단일 선택.
 *
 *   mode='destination' — 여행지 갯수 (2/4/6/8), 라벨 "N개"
 *   mode='tournament'  — 토너먼트 사이즈 (4/8/16/32), 라벨 "N강"
 */

export interface CountSelectorProps {
  value: TournamentCount | null;
  onChange: (value: TournamentCount) => void;
  mode: 'destination' | 'tournament';
  showLabel?: boolean;
}

export function CountSelector({
  value,
  onChange,
  mode,
  showLabel = true,
}: CountSelectorProps) {
  const tDestination = useTranslations('tournament.setup.count');
  const tTournament = useTranslations('tournament.play.tournamentSize.count');
  const tAria = useTranslations('tournament');

  const options =
    mode === 'destination'
      ? DESTINATION_COUNT_OPTIONS
      : TOURNAMENT_SIZE_OPTIONS;

  const ariaLabel =
    mode === 'destination'
      ? tAria('setup.steps.count.title')
      : tAria('play.tournamentSize.title');

  const labelOf = (c: TournamentCount): string => {
    if (mode === 'destination') {
      switch (c) {
        case 2:
          return tDestination('2');
        case 4:
          return tDestination('4');
        case 6:
          return tDestination('6');
        case 8:
          return tDestination('8');
        default:
          return '';
      }
    }
    switch (c) {
      case 4:
        return tTournament('4');
      case 8:
        return tTournament('8');
      case 16:
        return tTournament('16');
      case 32:
        return tTournament('32');
      default:
        return '';
    }
  };

  const pick = (c: TournamentCount) => {
    haptic.tap();
    onChange(c);
  };

  return (
    <div className={styles.grid} role="radiogroup" aria-label={ariaLabel}>
      {options.map((c) => {
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
            {showLabel && <span className={styles.label}>{labelOf(c)}</span>}
          </button>
        );
      })}
    </div>
  );
}
