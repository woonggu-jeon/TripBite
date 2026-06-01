'use client';

import { useTranslations } from 'next-intl';
import { haptic } from '@/lib/haptic';
import { cardClasses } from '@/components/ui';
import { CHUNGBUK_REGIONS } from '@/constants/regions';
import type { Destination } from '@/features/tournament/types';
import styles from './MatchupCard.module.scss';

const CATEGORY_EMOJI = {
  local: '🏘️',
  festival: '🎪',
  attraction: '📍',
  experience: '🎨',
} as const;

export interface MatchupCardProps {
  destination: Destination;
  onPick: () => void;
  disabled?: boolean;
}

/**
 * 1:1 매치업 카드. 클릭/탭 시 onPick. 세로 2칸 레이아웃의 한 칸.
 *
 * 이미지가 없을 때(현재 mock) 카테고리 이모지를 큰 placeholder 로.
 */
export function MatchupCard({
  destination,
  onPick,
  disabled = false,
}: MatchupCardProps) {
  const t = useTranslations('tournament');
  const region = CHUNGBUK_REGIONS.find((r) => r.code === destination.region);
  const regionLabel = region?.ko ?? destination.region;
  const categoryLabel = t(`category.${destination.category}`);

  return (
    <button
      type="button"
      className={cardClasses({
        variant: 'surface',
        className: styles.card,
      })}
      onClick={() => {
        if (disabled) return;
        haptic.tap();
        onPick();
      }}
      disabled={disabled}
      aria-label={`${destination.name} 선택`}
    >
      <div className={styles.image} aria-hidden>
        <span className={styles.emoji}>
          {CATEGORY_EMOJI[destination.category]}
        </span>
      </div>
      <div className={styles.body}>
        <h3 className={styles.name}>{destination.name}</h3>
        <p className={styles.meta}>
          <span className={styles.region}>{regionLabel}</span>
          <span aria-hidden> · </span>
          <span className={styles.category}>{categoryLabel}</span>
        </p>
      </div>
    </button>
  );
}
