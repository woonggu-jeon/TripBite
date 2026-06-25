import Image from 'next/image';
import type { Season } from '@/api/generated/schemas';

/**
 * 시즌 아이콘 — Figma "seasonIcon" 정합 (2026-06-25).
 *
 * spec:
 *   - size 36: 컨테이너 36×36 + 안쪽 image 28×28 (4px 여백 each side).
 *   - size 64: 컨테이너 64×64 + 안쪽 image 52×52 (6px 여백 each side).
 *
 * asset: `public/icons/seasons/{season}.png` — Figma export PNG.
 */
const SIZES = {
  36: { container: 36, image: 28 },
  64: { container: 64, image: 52 },
} as const;

export type SeasonIconSize = keyof typeof SIZES;

interface Props {
  season: Season;
  size?: SeasonIconSize;
  className?: string;
}

const SEASON_ALT: Record<Season, string> = {
  spring: '봄',
  summer: '여름',
  autumn: '가을',
  winter: '겨울',
};

export function SeasonIcon({ season, size = 64, className }: Props) {
  const { container, image } = SIZES[size];
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: container,
        height: container,
      }}
    >
      <Image
        src={`/icons/seasons/${season}.png`}
        alt={SEASON_ALT[season]}
        width={image}
        height={image}
        priority={size === 64}
      />
    </span>
  );
}
