'use client';

import { useTranslations } from 'next-intl';
import { haptic } from '@/lib/haptic';
import { cardClasses } from '@/components/ui';
import type { SpecialDay } from '@/features/tournament/types';
import styles from './SpecialDaySelector.module.scss';

const ITEMS: { value: SpecialDay; emoji: string }[] = [
  { value: 'birthday', emoji: '🎂' },
  { value: 'anniversary', emoji: '💍' },
];

export interface SpecialDaySelectorProps {
  value: SpecialDay | null;
  onChange: (day: SpecialDay) => void;
}

/**
 * 토너먼트 2단계(특별한 날 분기) — 생일 / 결혼기념일 2지선택.
 *
 * 타입 정의(`SpecialDay`)의 'anniversary' 는 UI에선 "결혼기념일"로 표기.
 * 추후 더 많은 종류(어버이날·발렌타인 등) 필요해지면 타입에 추가.
 */
export function SpecialDaySelector({
  value,
  onChange,
}: SpecialDaySelectorProps) {
  const t = useTranslations('tournament');

  const pick = (d: SpecialDay) => {
    haptic.tap();
    onChange(d);
  };

  return (
    <div
      className={styles.grid}
      role="radiogroup"
      aria-label={t('setup.steps.special.title')}
    >
      {ITEMS.map((it) => {
        const active = value === it.value;
        return (
          <button
            key={it.value}
            type="button"
            role="radio"
            aria-checked={active}
            className={cardClasses({
              variant: 'surface',
              padding: 'none',
              className: `${styles.card} ${active ? styles.active : ''}`,
            })}
            onClick={() => pick(it.value)}
          >
            <span className={styles.emoji} aria-hidden>
              {it.emoji}
            </span>
            <span className={styles.label}>{t(`specialDay.${it.value}`)}</span>
          </button>
        );
      })}
    </div>
  );
}
