'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { haptic } from '@/lib/haptic';
import { cardClasses } from '@/components/ui';
import { CHUNGBUK_REGIONS } from '@/constants/regions';
import { categoryEmoji } from '@/constants/emoji-map';
import { secureImageUrl } from '@/lib/secure-image-url';
import type { Destination } from '@/features/tournament/types';
import styles from './MatchupCard.module.scss';

export interface MatchupCardProps {
  destination: Destination;
  onPick: () => void;
  disabled?: boolean;
}

/**
 * 1:1 매치업 카드. 클릭/탭 시 onPick. 세로 2칸 레이아웃의 한 칸.
 *
 * imageUrl 있으면 next/image fill, 없으면 카테고리 이모지 placeholder.
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
  const safeImg = secureImageUrl(destination.imageUrl);

  return (
    <button
      type="button"
      className={cardClasses({
        variant: 'surface',
        className: styles.card,
      })}
      onClick={(e) => {
        if (disabled) return;
        haptic.tap();
        // iOS Safari / PWA — tap 후 focus 가 button 에 남고, React 가 같은
        // DOM 을 다음 매치에서 재사용하면 "이전 선택지가 다시 강조된 것처럼"
        // 보임. blur() 로 focus 명시 해제 (Bracket.tsx 의 key 교체와 이중 안전망).
        e.currentTarget.blur();
        onPick();
      }}
      disabled={disabled}
      aria-label={`${destination.name} 선택`}
    >
      <div className={styles.image} aria-hidden>
        {safeImg ? (
          <Image
            src={safeImg}
            alt=""
            fill
            sizes="(max-width: 380px) 40vw, 160px"
            className={styles.photo}
          />
        ) : (
          <span className={styles.emoji}>
            {categoryEmoji(destination.category)}
          </span>
        )}
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
