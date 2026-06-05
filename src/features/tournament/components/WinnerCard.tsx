'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Card, Chip } from '@/components/ui';
import { CHUNGBUK_REGIONS } from '@/constants/regions';
import { categoryEmoji } from '@/constants/emoji-map';
import { secureImageUrl } from '@/lib/secure-image-url';
import type { Destination } from '@/features/tournament/types';
import styles from './WinnerCard.module.scss';

/**
 * 토너먼트 우승 여행지 카드.
 * 트로피 + 카테고리 이모지 + 우승 이름 + 시군·카테고리 메타.
 *
 * primitive 사용:
 *   - <Card variant="highlighted"> — 그라데이션 + primary border + shadow
 *   - <Chip variant="primary"> — region 라벨
 * 자체 SCSS 는 grid/place-items 같은 layout 만 담당 (디자인 토큰 일관성).
 */
export function WinnerCard({ destination }: { destination: Destination }) {
  const t = useTranslations('tournament');
  const region = CHUNGBUK_REGIONS.find((r) => r.code === destination.region);
  const regionLabel = region?.ko ?? destination.region;
  const categoryLabel = t(`category.${destination.category}`);
  const safeImg = secureImageUrl(destination.imageUrl);

  return (
    <Card
      variant="highlighted"
      padding="lg"
      className={styles.card}
      aria-label={`우승 ${destination.name}`}
    >
      <div className={styles.trophy} aria-hidden>
        🏆
      </div>
      <div className={styles.image} aria-hidden>
        {safeImg ? (
          <Image
            src={safeImg}
            alt=""
            fill
            sizes="96px"
            className={styles.photo}
          />
        ) : (
          <span className={styles.emoji}>
            {categoryEmoji(destination.category)}
          </span>
        )}
      </div>
      <h2 className={styles.name}>{destination.name}</h2>
      <p className={styles.meta}>
        <Chip variant="primary" size="sm">
          {regionLabel}
        </Chip>
        <span className={styles.category}>{categoryLabel}</span>
      </p>
    </Card>
  );
}
