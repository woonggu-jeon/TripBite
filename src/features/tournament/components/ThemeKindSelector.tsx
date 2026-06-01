'use client';

import { useTranslations } from 'next-intl';
import { haptic } from '@/lib/haptic';
import { cardClasses } from '@/components/ui';
import styles from './ThemeKindSelector.module.scss';

export type ThemeKind = 'season' | 'random';

export interface ThemeKindSelectorProps {
  value: ThemeKind | null;
  onChange: (kind: ThemeKind) => void;
}

/**
 * 토너먼트 1단계 — 계절 직접선택 / 랜덤테마 2지선택.
 *
 * 동작 (TournamentSetup 측):
 *   - season: 다음 step 으로 → 계절 선택 → 유형 선택 → 갯수
 *   - random: 계절 + 유형을 즉시 랜덤 선택 → 바로 갯수 step
 */
export function ThemeKindSelector({ value, onChange }: ThemeKindSelectorProps) {
  const t = useTranslations('tournament.setup.steps.themeKind');

  const pick = (k: ThemeKind) => {
    haptic.tap();
    onChange(k);
  };

  const KINDS: {
    value: ThemeKind;
    emoji: string;
    labelKey: 'season' | 'random';
    descKey: 'seasonDesc' | 'randomDesc';
  }[] = [
    { value: 'season', emoji: '🌿', labelKey: 'season', descKey: 'seasonDesc' },
    {
      value: 'random',
      emoji: '🎲',
      labelKey: 'random',
      descKey: 'randomDesc',
    },
  ];

  return (
    <div className={styles.grid} role="radiogroup" aria-label={t('title')}>
      {KINDS.map((k) => {
        const active = value === k.value;
        return (
          <button
            key={k.value}
            type="button"
            role="radio"
            aria-checked={active}
            className={cardClasses({
              variant: 'surface',
              // padding 은 module .card 가 직접 명시 — Card primitive 의 .p-*
              // 와 source order 충돌 방지 (cardClasses padding 옵션 미사용)
              className: `${styles.card} ${active ? styles.active : ''}`,
            })}
            onClick={() => pick(k.value)}
          >
            <span className={styles.emoji} aria-hidden>
              {k.emoji}
            </span>
            <span className={styles.label}>{t(k.labelKey)}</span>
            <span className={styles.desc}>{t(k.descKey)}</span>
          </button>
        );
      })}
    </div>
  );
}
