'use client';

import { useEffect, useState } from 'react';
import type { RegionCode } from '@/constants/regions';
import { haptic } from '@/lib/haptic';
import type { Destination, TournamentTheme } from '@/features/tournament/types';
import styles from './ChungbukMap.module.scss';

/**
 * 충북 지도 + 풀(여행지) 표시 + 다중 선택.
 *
 * 외곽은 충북 모양에 가까운 polygon path 로 그림 (정확한 행정경계는 아님).
 * 시군 좌표는 viewBox 0~100 정규화. 각 여행지는 자기 시군 좌표 근처로 jitter 후 배치.
 *
 * 모드:
 *   - selected/onToggle/maxSelect 가 주어지면 다중 선택 가능 (button).
 *   - 미전달이면 단순 표시.
 */

const POINTS: Record<RegionCode, { x: number; y: number }> = {
  cheongju: { x: 24, y: 56 },
  chungju: { x: 54, y: 24 },
  jecheon: { x: 73, y: 18 },
  boeun: { x: 37, y: 68 },
  okcheon: { x: 22, y: 80 },
  yeongdong: { x: 39, y: 90 },
  jincheon: { x: 14, y: 32 },
  goesan: { x: 47, y: 44 },
  eumseong: { x: 33, y: 24 },
  danyang: { x: 86, y: 28 },
  jeungpyeong: { x: 26, y: 40 },
};

// 충북 도경계 근사 polygon (정규화 0~100)
const CHUNGBUK_PATH =
  'M 12 35 L 22 22 L 38 14 L 55 11 L 70 10 L 80 14 L 90 20 L 95 30 L 93 42 L 80 54 L 72 65 L 58 78 L 48 92 L 35 96 L 22 90 L 14 76 L 10 60 L 10 46 Z';

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
    // 같은 시군 여러 항목이 겹치지 않도록 약간 흩뿌림
    const jx = (Math.random() - 0.5) * 10;
    const jy = (Math.random() - 0.5) * 10;
    return {
      id: d.id,
      name: d.name,
      x: Math.max(6, Math.min(94, base.x + jx)),
      y: Math.max(6, Math.min(94, base.y + jy)),
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
      <svg
        viewBox="0 0 100 100"
        className={styles.svg}
        role="img"
        aria-label="충청북도 지도"
        preserveAspectRatio="none"
      >
        <path d={CHUNGBUK_PATH} className={styles.outline} />
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
