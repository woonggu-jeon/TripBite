'use client';

import { useTranslations } from 'next-intl';
import { cardClasses, RadioGroup, RadioOption } from '@/components/ui';
import { Illustration } from '@/components/brand/Illustration';
import { seasonIllustration } from '@/constants/illustration-map';
import type { Season } from '@/api/generated/schemas';
import styles from './SeasonSelector.module.scss';

// 일러스트는 Figma `seasonIcon` 에셋 — 구 이모지(🌸 🌊 🍂 ❄) 대체.
// 시안의 여름은 파도가 아니라 태양이다.
const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter'];

export interface SeasonSelectorProps {
  value: Season | null;
  onChange: (season: Season) => void;
}

/**
 * 토너먼트 2단계(계절 분기) — 봄/여름/가을/겨울 4지선택.
 * 2×2 그리드, 계절별 컬러 그라데이션.
 */
export function SeasonSelector({ value, onChange }: SeasonSelectorProps) {
  const t = useTranslations('tournament');

  return (
    <RadioGroup label={t('setup.steps.season.title')} className={styles.grid}>
      {SEASONS.map((season) => {
        const active = value === season;
        const art = seasonIllustration(season);
        return (
          <RadioOption
            key={season}
            checked={active}
            onSelect={() => onChange(season)}
            className={cardClasses({
              variant: 'surface',
              className: `${styles.card} ${active ? styles.active : ''} ${styles[season] ?? ''}`,
            })}
          >
            <span className={styles.emoji} aria-hidden>
              {art && <Illustration name={art} size={64} />}
            </span>
            <span className={styles.label}>{t(`season.${season}`)}</span>
          </RadioOption>
        );
      })}
    </RadioGroup>
  );
}
