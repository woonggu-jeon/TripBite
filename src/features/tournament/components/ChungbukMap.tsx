'use client';

import { useEffect, useState } from 'react';
import type { RegionCode } from '@/constants/regions';
import type { Destination, TournamentTheme } from '@/features/tournament/types';
import styles from './ChungbukMap.module.scss';

/**
 * 충북 지도 (대략) + 토너먼트 참가 여행지 N개가 시군 위치로 떨어지는 애니메이션.
 *
 * 정확한 도경계 SVG path는 별도 자원이 필요해 일단 둥근 사각형 외곽 + 시군 점으로 대체.
 * 시군 좌표는 실제 시청 좌표를 0~100 비율로 정규화.
 */

const POINTS: Record<RegionCode, { x: number; y: number }> = {
  cheongju: { x: 24, y: 56 },
  chungju: { x: 54, y: 24 },
  jecheon: { x: 73, y: 12 },
  boeun: { x: 37, y: 68 },
  okcheon: { x: 22, y: 80 },
  yeongdong: { x: 39, y: 92 },
  jincheon: { x: 12, y: 32 },
  goesan: { x: 47, y: 44 },
  eumseong: { x: 33, y: 24 },
  danyang: { x: 90, y: 22 },
  jeungpyeong: { x: 26, y: 40 },
};

const SEASON_GLYPH = {
  spring: '🌸',
  summer: '💧',
  autumn: '🍂',
  winter: '❄️',
} as const;

const SPECIAL_GLYPH = {
  birthday: '🎁',
  anniversary: '💝',
} as const;

function getGlyph(theme: TournamentTheme): string {
  return theme.kind === 'season'
    ? SEASON_GLYPH[theme.value]
    : SPECIAL_GLYPH[theme.value];
}

interface Placed {
  id: string;
  name: string;
  x: number;
  y: number;
  delay: number;
}

function placeAll(destinations: Destination[]): Placed[] {
  return destinations.map((d, i) => {
    const base = POINTS[d.region as RegionCode] ?? { x: 50, y: 50 };
    const jx = (Math.random() - 0.5) * 8;
    const jy = (Math.random() - 0.5) * 8;
    return {
      id: d.id,
      name: d.name,
      x: Math.max(4, Math.min(96, base.x + jx)),
      y: Math.max(4, Math.min(96, base.y + jy)),
      delay: i * 0.08,
    };
  });
}

export interface ChungbukMapProps {
  destinations: Destination[];
  theme: TournamentTheme;
  /** 모든 일러스트 낙하 완료 후 호출 */
  onReady?: () => void;
}

export function ChungbukMap({
  destinations,
  theme,
  onReady,
}: ChungbukMapProps) {
  const [placed] = useState<Placed[]>(() => placeAll(destinations));
  const glyph = getGlyph(theme);

  useEffect(() => {
    if (!onReady) return;
    const last =
      placed.length > 0 ? (placed[placed.length - 1]?.delay ?? 0) : 0;
    const totalMs = (last + 1.2) * 1000;
    const id = setTimeout(onReady, totalMs);
    return () => clearTimeout(id);
  }, [onReady, placed]);

  return (
    <div className={styles.wrap}>
      <svg
        viewBox="0 0 100 100"
        className={styles.svg}
        role="img"
        aria-label="충청북도 지도"
        preserveAspectRatio="none"
      >
        <rect
          x={2}
          y={2}
          width={96}
          height={96}
          rx={14}
          ry={14}
          className={styles.outline}
        />
        {Object.values(POINTS).map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={1.2}
            className={styles.regionDot}
          />
        ))}
      </svg>

      <div className={styles.overlay}>
        {placed.map((p) => (
          <span
            key={p.id}
            className={styles.drop}
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              animationDelay: `${p.delay}s`,
            }}
            aria-label={p.name}
          >
            {glyph}
          </span>
        ))}
      </div>
    </div>
  );
}
