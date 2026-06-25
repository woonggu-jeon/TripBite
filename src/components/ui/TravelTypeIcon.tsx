import Image from 'next/image';
import type { TravelTypeCode } from '@/api/generated/schemas';

/**
 * 여행 유형 아이콘 — Figma "tripTypeIcon" 정합 (2026-06-25).
 *
 * BE `TravelTypeCode` ↔ Figma PNG name 매핑:
 *   - adventurer → challenge
 *   - explorer   → explore
 *   - relaxer    → rest
 *   - foodie     → taste
 *
 * asset: `public/icons/travel-types/{name}.png` — Figma export PNG (52×52 base).
 */
const CODE_TO_ICON: Record<TravelTypeCode, string> = {
  adventurer: 'challenge',
  explorer: 'explore',
  relaxer: 'rest',
  foodie: 'taste',
};

const CODE_TO_ALT: Record<TravelTypeCode, string> = {
  adventurer: '도전',
  explorer: '탐험',
  relaxer: '휴식',
  foodie: '맛집',
};

interface Props {
  code: TravelTypeCode;
  size?: number;
  className?: string;
  priority?: boolean;
}

export function TravelTypeIcon({
  code,
  size = 52,
  className,
  priority,
}: Props) {
  const iconName = CODE_TO_ICON[code];
  return (
    <Image
      src={`/icons/travel-types/${iconName}.png`}
      alt={CODE_TO_ALT[code]}
      width={size}
      height={size}
      className={className}
      priority={priority}
    />
  );
}
