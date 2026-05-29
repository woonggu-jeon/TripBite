'use client';

import { useTranslations } from 'next-intl';
import { CHUNGBUK_REGIONS } from '@/constants/regions';
import type { Destination } from '@/features/tournament/types';
import styles from './WinnerCard.module.scss';

const CATEGORY_EMOJI = {
  local: '🏘️',
  festival: '🎪',
  attraction: '📍',
  experience: '🎨',
} as const;

/**
 * 토너먼트 우승 여행지 카드.
 * 트로피 + 카테고리 이모지 + 우승 이름 + 시군·카테고리 메타.
 */
export function WinnerCard({ destination }: { destination: Destination }) {
  const t = useTranslations('tournament');
  const region = CHUNGBUK_REGIONS.find((r) => r.code === destination.region);
  const regionLabel = region?.ko ?? destination.region;
  const categoryLabel = t(`category.${destination.category}`);

  return (
    <article className={styles.card} aria-label={`우승 ${destination.name}`}>
      <div className={styles.trophy} aria-hidden>
        🏆
      </div>
      <div className={styles.image} aria-hidden>
        <span className={styles.emoji}>
          {CATEGORY_EMOJI[destination.category]}
        </span>
      </div>
      <h2 className={styles.name}>{destination.name}</h2>
      <p className={styles.meta}>
        <span className={styles.region}>{regionLabel}</span>
        <span aria-hidden> · </span>
        <span>{categoryLabel}</span>
      </p>
    </article>
  );
}
