'use client';

import { useTranslations } from 'next-intl';
import { RadioGroup } from '@/components/ui';
import { Illustration } from '@/components/brand/Illustration';
import { categoryIllustration } from '@/constants/illustration-map';
import type { DestinationCategory } from '@/api/generated/schemas';
import { SelectCard } from './SelectCard';
import styles from './CategoryFilter.module.scss';

const CATEGORIES: readonly DestinationCategory[] = [
  'festival',
  'attraction',
  'experience',
];

export interface CategoryFilterProps {
  value: DestinationCategory | null;
  onChange: (value: DestinationCategory) => void;
}

/**
 * 여행 유형 3종 — 세로 1열 3행 카드. 단일 선택.
 * 선택 즉시 부모로 onChange — 부모(TournamentSetup)에서 다음 step 자동 진행.
 *
 * Figma `big-card` 320x94 — 원형 배지(54) + 36px `cateIcon` + 이름 + 설명.
 * 구 구현은 이모지(🎪 📍 🎨) + 우측 체크표시였고 설명 줄이 없었다.
 */
export function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  const t = useTranslations('tournament');

  return (
    <RadioGroup label={t('setup.steps.category.title')} className={styles.list}>
      {CATEGORIES.map((c) => {
        const art = categoryIllustration(c);
        return (
          <SelectCard
            key={c}
            layout="row"
            selected={value === c}
            onSelect={() => onChange(c)}
            media={art ? <Illustration name={art} size={36} /> : null}
            title={t(`category.${c}`)}
            desc={t(`category.desc.${c}`)}
          />
        );
      })}
    </RadioGroup>
  );
}
