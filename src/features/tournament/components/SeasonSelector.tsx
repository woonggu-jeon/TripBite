'use client';

import { useTranslations } from 'next-intl';
import { RadioGroup } from '@/components/ui';
import { Illustration } from '@/components/brand/Illustration';
import { seasonIllustration } from '@/constants/illustration-map';
import type { Season } from '@/types/api-domain';
import { SelectCard } from './SelectCard';
import styles from './SeasonSelector.module.scss';

// 일러스트는 Figma `seasonIcon` 에셋 — 구 이모지(🌸 🌊 🍂 ❄) 대체.
// 시안의 여름은 파도가 아니라 태양이다.
const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter'];

/**
 * Figma `season-card` 의 원형 배지 면색 — 계절별 파스텔.
 * 선택 여부와 무관하게 유지된다 (테마·카테고리 카드와 다른 점).
 */
const CIRCLE_TONE: Record<Season, string> = {
  spring: '#ffebeb',
  summer: '#e0ff89',
  autumn: '#ffcd99',
  winter: '#e8f1fd',
};

export interface SeasonSelectorProps {
  value: Season | null;
  onChange: (season: Season) => void;
}

/**
 * 토너먼트 2단계(계절 분기) — 봄/여름/가을/겨울 4지선택.
 *
 * Figma `season-card` 154x145 — 파스텔 원형 + 계절명 + 한 줄 설명.
 * 구 구현은 계절별 그라데이션 배경이었는데 시안에는 없다 (선택 표시는
 * 연초록 면 + 초록 테두리로 통일).
 */
export function SeasonSelector({ value, onChange }: SeasonSelectorProps) {
  const t = useTranslations('tournament');

  return (
    <RadioGroup label={t('setup.steps.season.title')} className={styles.grid}>
      {SEASONS.map((season) => {
        const art = seasonIllustration(season);
        return (
          <SelectCard
            key={season}
            layout="column"
            selected={value === season}
            onSelect={() => onChange(season)}
            mediaTone={CIRCLE_TONE[season]}
            media={art ? <Illustration name={art} size={36} /> : null}
            title={t(`season.${season}`)}
            desc={t(`season.desc.${season}`)}
          />
        );
      })}
    </RadioGroup>
  );
}
