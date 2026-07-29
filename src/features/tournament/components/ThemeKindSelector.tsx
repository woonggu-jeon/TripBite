'use client';

import { useTranslations } from 'next-intl';
import {
  RadioGroup,
  RadioOption,
  ThemeIcon,
  cardClasses,
} from '@/components/ui';
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

  // Figma "themeIcon" PNG asset 매핑 (2026-06-25 정합):
  //   - season → public/icons/themes/season.png
  //   - random → public/icons/themes/dice.png
  const KINDS: {
    value: ThemeKind;
    iconKind: 'season' | 'dice';
    labelKey: 'season' | 'random';
    descKey: 'seasonDesc' | 'randomDesc';
  }[] = [
    {
      value: 'season',
      iconKind: 'season',
      labelKey: 'season',
      descKey: 'seasonDesc',
    },
    {
      value: 'random',
      iconKind: 'dice',
      labelKey: 'random',
      descKey: 'randomDesc',
    },
  ];

  return (
    <RadioGroup label={t('title')} className={styles.grid}>
      {KINDS.map((k) => {
        const active = value === k.value;
        return (
          <RadioOption
            key={k.value}
            checked={active}
            onSelect={() => onChange(k.value)}
            className={cardClasses({
              variant: 'surface',
              // padding 은 module .card 가 직접 명시 — Card primitive 의 .p-*
              // 와 source order 충돌 방지 (cardClasses padding 옵션 미사용)
              className: `${styles.card} ${active ? styles.active : ''}`,
            })}
          >
            <span className={styles.emoji} aria-hidden>
              <ThemeIcon theme={k.iconKind} size={36} />
            </span>
            <span className={styles.label}>{t(k.labelKey)}</span>
            <span className={styles.desc}>{t(k.descKey)}</span>
          </RadioOption>
        );
      })}
    </RadioGroup>
  );
}
