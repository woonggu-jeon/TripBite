'use client';

import { useTranslations } from 'next-intl';
import { haptic } from '@/lib/haptic';
import styles from './ThemeKindSelector.module.scss';

export type ThemeKind = 'season' | 'special';

export interface ThemeKindSelectorProps {
  value: ThemeKind | null;
  onChange: (kind: ThemeKind) => void;
}

/**
 * 토너먼트 1단계 — 계절 / 특별한 날 2지선택.
 * 선택 즉시 2단계로 자동 전환되도록 상위에서 처리.
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
    labelKey: 'season' | 'special';
    descKey: 'seasonDesc' | 'specialDesc';
  }[] = [
    { value: 'season', emoji: '🌿', labelKey: 'season', descKey: 'seasonDesc' },
    {
      value: 'special',
      emoji: '🎉',
      labelKey: 'special',
      descKey: 'specialDesc',
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
            className={`${styles.card} ${active ? styles.active : ''}`}
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
