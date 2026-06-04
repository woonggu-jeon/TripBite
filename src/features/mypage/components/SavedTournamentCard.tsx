'use client';

import Link from 'next/link';
import { Card, DestinationCard } from '@/components/ui';
import { CHUNGBUK_REGIONS, type RegionCode } from '@/constants/regions';
import { toneFor } from '@/constants/region-tone';
import { categoryEmoji, FALLBACK_TROPHY_EMOJI } from '@/constants/emoji-map';
import type { SavedTournament } from '@/features/tournament/types';
import styles from './SavedTournamentCard.module.scss';

/**
 * 저장된 토너먼트 우승 여행지 카드.
 *
 * layout:
 *   - 'tile' (default) : `DestinationCard` primitive 재사용 — FestivalCarousel /
 *     RelatedDestinations 와 같은 디자인. luckyColor 는 accentDot 으로 작게 표시.
 *   - 'row'             : 가로 카드 — /mypage/saved-tournaments 상세 리스트 전용.
 *                         row 는 destination 외 luckyColor / meetChance 메타가
 *                         더 큰 영역으로 노출되도록 별도 layout 유지.
 */
export function SavedTournamentCard({
  saved,
  layout = 'tile',
}: {
  saved: SavedTournament;
  layout?: 'tile' | 'row';
}) {
  const region = CHUNGBUK_REGIONS.find(
    (r) => r.code === saved.destination.region,
  );
  const regionLabel = region?.ko ?? saved.destination.region;
  const emoji = categoryEmoji(
    saved.destination.category,
    FALLBACK_TROPHY_EMOJI,
  );

  if (layout === 'tile') {
    return (
      <DestinationCard
        href={{ pathname: `/destination/${saved.destination.id}` }}
        emoji={emoji}
        tone={toneFor(saved.destination.region as RegionCode)}
        regionLabel={regionLabel}
        name={saved.destination.name}
        accentDot={saved.luckyColor}
        ariaLabel={`${saved.destination.name} · ${regionLabel}`}
      />
    );
  }

  // row layout — 상세 리스트 전용.
  return (
    <Card variant="surface" padding="none" className={styles.card}>
      <Link
        href={{ pathname: `/destination/${saved.destination.id}` }}
        prefetch={false}
        className={styles.linkRow}
        aria-label={`${saved.destination.name} 상세`}
      >
        <div className={styles.image} aria-hidden>
          <span
            className={styles.colorChip}
            style={{ background: saved.luckyColor }}
          />
          <span className={styles.emoji}>{emoji}</span>
        </div>
        <div className={styles.body}>
          <h3 className={styles.name}>{saved.destination.name}</h3>
          <p className={styles.meta}>{regionLabel}</p>
        </div>
      </Link>
    </Card>
  );
}
