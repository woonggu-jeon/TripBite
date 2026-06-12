'use client';

import { useTranslations } from 'next-intl';
import { RadioGroup, RadioOption } from '@/components/ui';
import type { DestinationCategory } from '@/api/generated/schemas';
import styles from './CategoryFilter.module.scss';

// 'local'(지역 명소) 은 UI 미노출 — 정책상 토너먼트 카테고리 선택은 축제 /
// 관광지 / 체험관광 3 종으로 제한 (DestinationCategory 타입은 'local' 유지 —
// 다른 영역에서 데이터 표시는 가능).
const CATEGORIES: { value: DestinationCategory; emoji: string }[] = [
  { value: 'festival', emoji: '🎪' },
  { value: 'attraction', emoji: '📍' },
  { value: 'experience', emoji: '🎨' },
];

export interface CategoryFilterProps {
  value: DestinationCategory | null;
  onChange: (value: DestinationCategory) => void;
}

/**
 * 여행 유형 3종 — 세로 1열 3행 카드. 단일 선택.
 * 선택 즉시 부모로 onChange — 부모(TournamentSetup)에서 다음 step 자동 진행.
 */
export function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  const t = useTranslations('tournament');

  return (
    <RadioGroup label={t('setup.steps.category.title')} className={styles.list}>
      {CATEGORIES.map((c) => {
        const active = value === c.value;
        return (
          <RadioOption
            key={c.value}
            checked={active}
            onSelect={() => onChange(c.value)}
            className={`${styles.row} ${active ? styles.active : ''}`}
          >
            <span className={styles.emoji} aria-hidden>
              {c.emoji}
            </span>
            <span className={styles.label}>{t(`category.${c.value}`)}</span>
            <span className={styles.check} aria-hidden>
              {active ? '✓' : ''}
            </span>
          </RadioOption>
        );
      })}
    </RadioGroup>
  );
}
