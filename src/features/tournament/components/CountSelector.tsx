'use client';

import { useTranslations } from 'next-intl';
import { haptic } from '@/lib/haptic';
import type { TournamentCount } from '@/features/tournament/types';
import styles from './CountSelector.module.scss';

const COUNTS: TournamentCount[] = [2, 4, 6, 8];

export interface CountSelectorProps {
  value: TournamentCount | null;
  onChange: (value: TournamentCount) => void;
  /** 이 값보다 큰 옵션은 disable (예: 토너먼트 사이즈 ≤ 여행지 갯수 강제) */
  max?: TournamentCount;
  /** 라벨 텍스트(2개/4개/6개/8개) 노출 여부 */
  showLabel?: boolean;
  /** aria-label 키 (steps.count.title | steps.tournamentSize.title) */
  ariaLabelKey?: 'steps.count.title' | 'steps.tournamentSize.title';
}

/**
 * 2×2 그리드 갯수 선택. 단일 선택.
 * 여행지 갯수 step / 토너먼트 개수 step 두 곳에서 재사용.
 */
export function CountSelector({
  value,
  onChange,
  max,
  showLabel = true,
  ariaLabelKey = 'steps.count.title',
}: CountSelectorProps) {
  const t = useTranslations('tournament.setup');

  const pick = (c: TournamentCount) => {
    haptic.tap();
    onChange(c);
  };

  return (
    <div className={styles.grid} role="radiogroup" aria-label={t(ariaLabelKey)}>
      {COUNTS.map((c) => {
        const disabled = max !== undefined && c > max;
        const active = value === c;
        return (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={active}
            aria-disabled={disabled}
            disabled={disabled}
            className={`${styles.card} ${active ? styles.active : ''}`}
            onClick={() => {
              if (disabled) return;
              pick(c);
            }}
          >
            <span className={styles.num}>{c}</span>
            {showLabel && (
              <span className={styles.label}>{t(`count.${c}`)}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
