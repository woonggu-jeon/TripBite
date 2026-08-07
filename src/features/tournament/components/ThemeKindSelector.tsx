'use client';

import { useTranslations } from 'next-intl';
import { RadioGroup } from '@/components/ui';
import {
  Illustration,
  type IllustrationName,
} from '@/components/brand/Illustration';
import { SelectCard } from './SelectCard';
import styles from './ThemeKindSelector.module.scss';

export type ThemeKind = 'season' | 'random';

export interface ThemeKindSelectorProps {
  value: ThemeKind | null;
  onChange: (kind: ThemeKind) => void;
}

/**
 * 토너먼트 1단계 — 계절 직접선택 / 랜덤테마 2지선택.
 *
 * Figma `big-card` 320x94 — 원형 배지(54) + 36px `themeIcon` + 이름 + 설명.
 * 세로 1열 2행 (구 구현은 2열 그리드였다).
 *
 * 동작 (TournamentSetup 측):
 *   - season: 다음 step 으로 → 계절 선택 → 유형 선택 → 갯수
 *   - random: 계절 + 유형을 즉시 랜덤 선택 → 바로 갯수 step
 */
const KINDS: {
  value: ThemeKind;
  art: IllustrationName;
  labelKey: 'season' | 'random';
  descKey: 'seasonDesc' | 'randomDesc';
}[] = [
  {
    value: 'season',
    art: 'theme-season',
    labelKey: 'season',
    descKey: 'seasonDesc',
  },
  {
    value: 'random',
    art: 'theme-dice',
    labelKey: 'random',
    descKey: 'randomDesc',
  },
];

export function ThemeKindSelector({ value, onChange }: ThemeKindSelectorProps) {
  const t = useTranslations('tournament.setup.steps.themeKind');

  return (
    <RadioGroup label={t('title')} className={styles.list}>
      {KINDS.map((k) => (
        <SelectCard
          key={k.value}
          layout="row"
          selected={value === k.value}
          onSelect={() => onChange(k.value)}
          media={<Illustration name={k.art} size={36} />}
          title={t(k.labelKey)}
          desc={t(k.descKey)}
        />
      ))}
    </RadioGroup>
  );
}
