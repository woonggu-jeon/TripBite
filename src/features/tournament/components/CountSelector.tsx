'use client';

import { useTranslations } from 'next-intl';
import { RadioGroup } from '@/components/ui';
import { SelectCard } from './SelectCard';
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
  const tDestinationSub = useTranslations('tournament.setup.count.sub');
  const tTournament = useTranslations('tournament.play.tournamentSize.count');
  const tTournamentSub = useTranslations(
    'tournament.play.tournamentSize.count.sub',
  );
  const tAria = useTranslations('tournament');

  const options =
    mode === 'destination'
      ? DESTINATION_COUNT_OPTIONS
      : TOURNAMENT_SIZE_OPTIONS;

  const ariaLabel =
    mode === 'destination'
      ? tAria('setup.steps.count.title')
      : tAria('play.tournamentSize.title');

  // 메인 타이틀 — "2개" / "4강"
  const titleOf = (c: TournamentCount): string => {
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

  return (
    <RadioGroup label={ariaLabel} className={styles.grid}>
      {options.map((c) => {
        // Figma `t5-text` 는 숫자(24 Bold)와 단위(14 Bold)를 따로 조판한다.
        // 문구는 i18n 한 덩어리("4강" / "4 rounds") 라 앞의 숫자만 떼어낸다.
        const label = titleOf(c);
        const num = String(c);
        const unit = label.startsWith(num) ? label.slice(num.length) : '';
        return (
          <SelectCard
            key={c}
            layout="column"
            selected={value === c}
            onSelect={() => onChange(c)}
            ariaLabel={showLabel ? `${label} ${subOf(c)}` : label}
            title={
              <span className={styles.amount}>
                <span className={styles.num}>{num}</span>
                {unit && <span className={styles.unit}>{unit}</span>}
              </span>
            }
            desc={showLabel ? subOf(c) : undefined}
          />
        );
      })}
    </RadioGroup>
  );
}
