'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';
import { MediaThumb } from '@/components/ui';
import { CHUNGBUK_REGIONS } from '@/constants/regions';
import { categoryEmoji } from '@/constants/emoji-map';
import type { DestinationDto } from '@/api/generated/schemas';
import styles from './WinnerCard.module.scss';

/**
 * 토너먼트 우승 hero — Figma "TRN · 토너먼트 결과" hero (320×176) 정합.
 *
 * 구성:
 *   - hero 320×176 radius 12 — image (full bleed) + 90deg dark gradient overlay
 *   - bottom-left 텍스트 250×63 column gap 4:
 *     · eyebrow Caption B_10 white "🏆 우승"
 *     · title B_20 white {destination.name}
 *     · location row Caption R_12 white "{region} · {category}"
 *
 * 폴백:
 *   - imageUrl 없으면 MediaThumb 가 emoji fallback (gradient overlay 위에서도
 *     읽힘 보장 위해 emoji는 어두운 배경 위 large emoji).
 */
function WinnerCardInner({ destination }: { destination: DestinationDto }) {
  const t = useTranslations('tournament');
  const tResult = useTranslations('tournament.result');
  const region = CHUNGBUK_REGIONS.find((r) => r.code === destination.region);
  const regionLabel = region?.ko ?? destination.region;
  const categoryLabel = t(`category.${destination.category}`);
  const eyebrow = tResult('winnerEyebrow');

  return (
    <section
      className={styles.hero}
      aria-label={`${eyebrow} ${destination.name}`}
    >
      <MediaThumb
        src={destination.imageUrl}
        emoji={categoryEmoji(destination.category)}
        sizes="320px"
        className={styles.image}
        emojiClassName={styles.emoji}
      />
      <div className={styles.gradient} aria-hidden />
      <div className={styles.text}>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <h2 className={styles.title}>{destination.name}</h2>
        <p className={styles.location}>
          {regionLabel} · {categoryLabel}
        </p>
      </div>
    </section>
  );
}

// React.memo — TournamentResultClient store/query 변경 시 불필요한 재렌더 회피.
// destination prop 이 stable DTO 이면 skip (자율 검토 2026-06-25).
export const WinnerCard = memo(WinnerCardInner);
