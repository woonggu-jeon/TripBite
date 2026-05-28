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

// 좌표는 chungbuk-map.png 라벨 위치 기준 정규화 (0~100).
// 라벨이 시군 영역 중앙에 가깝게 배치되어 있어 drop 배치 기준점으로 사용.
const POINTS: Record<RegionCode, { x: number; y: number }> = {
  cheongju: { x: 17, y: 52 },
  chungju: { x: 51, y: 19 },
  jecheon: { x: 62, y: 11 },
  boeun: { x: 41, y: 60 },
  okcheon: { x: 30, y: 72 },
  yeongdong: { x: 44, y: 87 },
  jincheon: { x: 21, y: 31 },
  goesan: { x: 46, y: 41 },
  eumseong: { x: 35, y: 26 },
  danyang: { x: 81, y: 21 },
  jeungpyeong: { x: 32, y: 39 },
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
    // 같은 시군 여러 항목이 겹치지 않도록 약간 흩뿌림 — 라벨과 겹치지 않게 살짝 아래로 편향
    const jx = (Math.random() - 0.5) * 8;
    const jy = (Math.random() - 0.5) * 8 + 4;
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
      <Image
        src="/images/chungbuk-map.png"
        alt="충청북도 지도"
        fill
        priority
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
