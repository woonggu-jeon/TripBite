'use client';

import { useTranslations } from 'next-intl';
import type { DestinationDto } from '@/api/generated/schemas';
import { MediaThumb } from '@/components/ui';
import { categoryEmoji } from '@/constants/emoji-map';
import { CHUNGBUK_REGIONS } from '@/constants/regions';
import { haptic } from '@/lib/haptic';
import styles from './MatchupCard.module.scss';

export interface MatchupCardProps {
  destination: DestinationDto;
  onPick: () => void;
  disabled?: boolean;
}

/**
 * 1:1 매치업 hero 카드 (Figma TRN 매치 8강).
 *
 * 320×176 radius 12. image fill + 90deg gradient (rgba 0.72→0.4→0→0).
 * bottom-left 250×63 텍스트: B_20 white name + pin 12 + R_12 region + Caption B_10 white desc.
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
  // DestinationDto 에 description 필드가 없으므로 카테고리 label 을 subtitle 로 사용.
  const subtitle = t(`category.${destination.category}`);

  return (
    <button
      type="button"
      className={styles.hero}
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
      <MediaThumb
        src={destination.imageUrl}
        emoji={categoryEmoji(destination.category)}
        sizes="(max-width: 380px) 90vw, 320px"
        className={styles.image}
        emojiClassName={styles.emoji}
      />
      <div className={styles.gradient} aria-hidden />
      <div className={styles.heroText}>
        <h3 className={styles.name}>{destination.name}</h3>
        <p className={styles.regionRow}>
          <svg
            className={styles.pin}
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden
          >
            <path
              d="M6 1.5a3 3 0 0 0-3 3c0 2.25 3 6 3 6s3-3.75 3-6a3 3 0 0 0-3-3Zm0 4.2a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4Z"
              fill="currentColor"
            />
          </svg>
          <span className={styles.region}>{regionLabel}</span>
        </p>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
    </button>
  );
}
