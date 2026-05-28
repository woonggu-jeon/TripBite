'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import type { RegionCode } from '@/constants/regions';
import { haptic } from '@/lib/haptic';
import type { Destination, TournamentTheme } from '@/features/tournament/types';
import styles from './ChungbukMap.module.scss';

/**
 * 충북 지도 + 풀(여행지) 표시 + 다중 선택.
 *
 * 배경: public/images/chungbuk-map.png (시군 외곽 + 라벨 포함된 light 톤 일러스트).
 * 시군 좌표(POINTS)는 해당 이미지의 라벨 위치 기준으로 정규화 (0~100).
 * 각 여행지는 자기 시군 좌표 근처로 jitter 후 배치.
 *
 * 모드:
 *   - selected/onToggle/maxSelect 가 주어지면 다중 선택 가능 (button).
 *   - 미전달이면 단순 표시.
 */

// 좌표는 chungbuk-final-map.svg 의 <text class="label"> 좌표(800×903 viewBox)를
// 0~100 비율로 정규화. SVG 라벨이 시군 영역 중앙에 배치돼 있어 drop 기준점으로 정확.
const SVG_W = 800;
const SVG_H = 903;
const norm = (x: number, y: number) => ({
  x: (x / SVG_W) * 100,
  y: (y / SVG_H) * 100,
});
const POINTS: Record<RegionCode, { x: number; y: number }> = {
  danyang: norm(675, 185),
  jecheon: norm(500, 165),
  chungju: norm(355, 185),
  eumseong: norm(205, 190),
  jincheon: norm(95, 280),
  jeungpyeong: norm(190, 345),
  goesan: norm(335, 350),
  cheongju: norm(115, 445),
  boeun: norm(255, 555),
  okcheon: norm(195, 690),
  yeongdong: norm(325, 790),
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
  // 같은 시군 다중 항목은 라벨 주변에 deterministic spiral 로 배치 (random jitter X).
  // 매번 같은 자리에 그려져 사용자가 "위치가 안 맞다"고 느끼지 않도록.
  const perRegion = new Map<RegionCode, number>();
  return destinations.map((d, i) => {
    const region = d.region as RegionCode;
    const base = POINTS[region] ?? { x: 50, y: 50 };
    const idx = perRegion.get(region) ?? 0;
    perRegion.set(region, idx + 1);

    // 첫 항목은 라벨 위치. 두 번째부터 golden angle spiral.
    let dx = 0;
    let dy = 0;
    if (idx > 0) {
      const angle = ((idx - 1) * 137.5 * Math.PI) / 180;
      const radius = 3.5 + (idx - 1) * 0.4;
      dx = radius * Math.cos(angle);
      dy = radius * Math.sin(angle);
    }

    return {
      id: d.id,
      name: d.name,
      x: Math.max(2, Math.min(98, base.x + dx)),
      y: Math.max(2, Math.min(98, base.y + dy)),
      delay: i * 0.05,
    };
  });
}

export interface ChungbukMapProps {
  destinations: Destination[];
  theme: TournamentTheme;
  /** 다중 선택 모드 — 선택된 id 집합 */
  selected?: Set<string>;
  /** 선택 토글 */
  onToggle?: (id: string) => void;
  /** 최대 선택 가능 개수 (도달 시 추가 선택 불가) */
  maxSelect?: number;
  /** 모든 일러스트 낙하 완료 후 호출 */
  onReady?: () => void;
}

export function ChungbukMap({
  destinations,
  theme,
  selected,
  onToggle,
  maxSelect,
  onReady,
}: ChungbukMapProps) {
  const [placed] = useState<Placed[]>(() => placeAll(destinations));
  const glyph = getGlyph(theme);
  const selectable = !!selected && !!onToggle;

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
      <Image
        src="/images/chungbuk-final-map.svg"
        alt="충청북도 지도"
        fill
        priority
        unoptimized
        sizes="(max-width: 480px) 100vw, 420px"
        className={styles.bg}
      />

      <div className={styles.overlay}>
        {placed.map((p) => {
          const isSelected = !!selected?.has(p.id);
          const reached =
            !!maxSelect &&
            !!selected &&
            !isSelected &&
            selected.size >= maxSelect;

          if (selectable) {
            return (
              <button
                key={p.id}
                type="button"
                className={[
                  styles.drop,
                  styles.button,
                  isSelected ? styles.selected : '',
                  reached ? styles.dimmed : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  animationDelay: `${p.delay}s`,
                }}
                onClick={() => {
                  if (reached) return;
                  haptic.tap();
                  onToggle?.(p.id);
                }}
                aria-pressed={isSelected}
                aria-label={p.name}
                title={p.name}
              >
                {glyph}
              </button>
            );
          }

          return (
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
          );
        })}
      </div>
    </div>
  );
}
