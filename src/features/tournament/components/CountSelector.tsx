'use client';

import { useTranslations } from 'next-intl';
import { RadioGroup, RadioOption } from '@/components/ui';
import {
  DESTINATION_COUNT_OPTIONS,
  TOURNAMENT_SIZE_OPTIONS,
  type TournamentCount,
} from '@/features/tournament/types';
import styles from './CountSelector.module.scss';

/**
 * 2×2 그리드 갯수 선택. 단일 선택.
 *
 *   mode='destination' — 여행지 갯수 (2/4/6/8), 단위 "개"
 *   mode='tournament'  — 토너먼트 사이즈 (4/8/16/32), 단위 "강"
 *
 * Figma "TRN · 여행지 수" (2026-06-22):
 *   big-card 154×92, padding 20, column center.
 *   number B_24 + unit B_14 같은 row (baseline aligned).
 *   sub Caption R_12 muted.
 *   active: 숫자/단위 primary tint + bg secondary01 + 1px primary border.
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
  const tDestinationSub = useTranslations('tournament.setup.count.sub');
  const tTournamentSub = useTranslations(
    'tournament.play.tournamentSize.count.sub',
  );
  const tAria = useTranslations('tournament');
  const tUnit = useTranslations('tournament.countUnit');

  const options =
    mode === 'destination'
      ? DESTINATION_COUNT_OPTIONS
      : TOURNAMENT_SIZE_OPTIONS;

  // RadioGroup aria-label — page heading 과 별도 (sr-only). page heading 이
  // season 변수 카피이므로 aria 는 단순 그룹 명 사용 (변수 X) — formatting
  // error 회피.
  const ariaLabel =
    mode === 'destination'
      ? tAria('setup.steps.count.ariaLabel')
      : tAria('play.tournamentSize.title');

  // mode 별 단위 — destination 은 "개", tournament 은 "강".
  const unit =
    mode === 'destination' ? tUnit('destination') : tUnit('tournament');

  // 하단 sub 텍스트 — "가볍게" / "기본 추천" 등
  const subOf = (c: TournamentCount): string => {
    if (mode === 'destination') {
      switch (c) {
        case 2:
          return tDestinationSub('2');
        case 4:
          return tDestinationSub('4');
        case 6:
          return tDestinationSub('6');
        case 8:
          return tDestinationSub('8');
        default:
          return '';
      }
    }
    switch (c) {
      case 4:
        return tTournamentSub('4');
      case 8:
        return tTournamentSub('8');
      case 16:
        return tTournamentSub('16');
      case 32:
        return tTournamentSub('32');
      default:
        return '';
    }
  };

  // aria-label — screen reader 친화적 ("2개, 가볍게" 같은 형태)
  const ariaOf = (c: TournamentCount): string => {
    const sub = subOf(c);
    return sub ? `${c}${unit}, ${sub}` : `${c}${unit}`;
  };

  return (
    <RadioGroup label={ariaLabel} className={styles.grid}>
      {options.map((c) => {
        const active = value === c;
        return (
          <RadioOption
            key={c}
            checked={active}
            onSelect={() => onChange(c)}
            aria-label={ariaOf(c)}
            className={`${styles.card} ${active ? styles.active : ''}`}
          >
            <span className={styles.t5Text}>
              <span className={styles.titleRow}>
                <span className={styles.number}>{c}</span>
                <span className={styles.unit}>{unit}</span>
              </span>
              {showLabel && <span className={styles.sub}>{subOf(c)}</span>}
            </span>
          </RadioOption>
        );
      })}
    </RadioGroup>
  );
}
