'use client';

import { useTranslations } from 'next-intl';
import { isRegionCode } from '@/constants/regions';
import type { RankedDestination } from '@/features/ranking/types';
import styles from './Top5Card.module.scss';

/**
 * 여행지 랭킹 Top5 카드.
 *
 *   ┌──┬─────────────────────┬───────┐
 *   │1 │ 청남대                │ 우승  │
 *   │  │ 청주시                │ 28회  │
 *   └──┴─────────────────────┴───────┘
 */
export function Top5Card({ item }: { item: RankedDestination }) {
  const t = useTranslations('ranking');
  const tRegion = useTranslations('region.names');
  const code = item.destination.region;
  const regionName = isRegionCode(code)
    ? tRegion(code as Parameters<typeof tRegion>[0])
    : code;
  // 시군명에서 시/군 글자 제거 (예: "단양군" → "단양", "청주시" → "청주")
  const shortRegion = regionName.replace(/(시|군)$/u, '');

  return (
    <article
      className={`${styles.card} ${styles[`rank${Math.min(item.rank, 5)}`] ?? ''}`}
      aria-label={`${item.rank}위 ${item.destination.name}`}
    >
      <div className={styles.rank} aria-hidden>
        {item.rank}
      </div>
      <div className={styles.body}>
        <h3 className={styles.name}>{item.destination.name}</h3>
        <p className={styles.region}>{shortRegion}</p>
      </div>
      <div className={styles.score}>
        <span className={styles.scoreNum}>{item.score}</span>
        <span className={styles.scoreLabel}>{t('winsUnit')}</span>
      </div>
    </article>
  );
}
