'use client';

import { Heart } from 'lucide-react';
import { DestinationCard } from '@/components/ui';
import { CHUNGBUK_REGIONS, type RegionCode } from '@/constants/regions';
import { toneFor } from '@/constants/region-tone';
import { categoryEmoji, FALLBACK_TROPHY_EMOJI } from '@/constants/emoji-map';
import type { SavedTournamentDto } from '@/api/generated/schemas';
import styles from './SavedTournamentCard.module.scss';

/**
 * 저장된 토너먼트 우승 여행지 카드 — `DestinationCard` primitive 재사용
 * (2026-06-23 정정: 자체 markup 회귀를 DestinationCard 재사용으로 복원).
 *
 * DestinationCard 가 이미 image-first (imageUrl 있을 때 next/image, 없을 때
 * emoji + tone gradient) + topRightAction 슬롯 + accentDot 지원 → wrap 만으로
 * Figma "MY · 저장한 우승지" DestinationCard (152×168 image + heart overlay)
 * 패턴 처리.
 *
 * heart 스타일은 Figma 정합 (28×28 white bg radius 14 + Heart 16 danger).
 * 이전 자체 markup 회귀 (시각 일부 차이 — region 위치 / aspect-ratio / padding)
 * 는 DestinationCard primitive 변경 시 광범위 영향 → SavedTournamentCard 만
 * primitive 재사용 (다른 사용처 region/[code] 등은 그대로).
 *
 * 사용처:
 *   1) 마이페이지 메인 carousel — `onUnsave` 미전달, heart 미노출
 *   2) /mypage/saved-tournaments 상세 — `onUnsave` 전달 → heart 노출
 */
export function SavedTournamentCard({
  saved,
  onUnsave,
  unsaveAriaLabel,
}: {
  saved: SavedTournamentDto;
  /** 우상단 하트 클릭 콜백 — 미전달 시 하트 미노출. */
  onUnsave?: () => void;
  /** 하트 a11y 라벨 — 호출부가 i18n 으로 전달. */
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
        size={16}
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
