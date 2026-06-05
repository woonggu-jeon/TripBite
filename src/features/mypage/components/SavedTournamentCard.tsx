'use client';

import { Heart } from 'lucide-react';
import { DestinationCard } from '@/components/ui';
import { CHUNGBUK_REGIONS, type RegionCode } from '@/constants/regions';
import { toneFor } from '@/constants/region-tone';
import { categoryEmoji, FALLBACK_TROPHY_EMOJI } from '@/constants/emoji-map';
import type { SavedTournament } from '@/features/tournament/types';
import styles from './SavedTournamentCard.module.scss';

/**
 * 저장된 토너먼트 우승 여행지 카드 — `DestinationCard` primitive 재사용.
 *
 * 사용처:
 *   1) 마이페이지 메인 carousel — `onUnsave` 미전달, 단순 카드
 *   2) /mypage/saved-tournaments 상세 2열 그리드 — `onUnsave` 전달 → 우상단 하트
 *
 * 하트 클릭은 Link navigation 과 충돌하므로 e.preventDefault() + stopPropagation()
 * 으로 직접 차단. confirm 흐름과 mutation 은 호출부 (SavedTournamentsAll) 담당.
 */
export function SavedTournamentCard({
  saved,
  onUnsave,
  unsaveAriaLabel,
}: {
  saved: SavedTournament;
  /** 우상단 하트 클릭 콜백 — 미전달 시 하트 미노출 (메인 carousel 등). */
  onUnsave?: () => void;
  /** 하트 a11y 라벨 — 호출부가 i18n 으로 전달. onUnsave 와 짝. */
  unsaveAriaLabel?: string;
}) {
  const region = CHUNGBUK_REGIONS.find(
    (r) => r.code === saved.destination.region,
  );
  const regionLabel = region?.ko ?? saved.destination.region;
  const emoji = categoryEmoji(
    saved.destination.category,
    FALLBACK_TROPHY_EMOJI,
  );

  const heart = onUnsave ? (
    <button
      type="button"
      className={styles.heart}
      aria-label={unsaveAriaLabel ?? 'Unsave'}
      onClick={(e) => {
        // Link navigation 차단 — 하트만 동작.
        e.preventDefault();
        e.stopPropagation();
        onUnsave();
      }}
    >
      <Heart
        size={18}
        aria-hidden
        fill="currentColor"
        strokeWidth={1.5}
        className={styles.heartIcon}
      />
    </button>
  ) : undefined;

  return (
    <DestinationCard
      href={{ pathname: `/destination/${saved.destination.id}` }}
      imageUrl={saved.destination.imageUrl}
      emoji={emoji}
      tone={toneFor(saved.destination.region as RegionCode)}
      regionLabel={regionLabel}
      name={saved.destination.name}
      accentDot={saved.luckyColor}
      ariaLabel={`${saved.destination.name} · ${regionLabel}`}
      topRightAction={heart}
    />
  );
}
