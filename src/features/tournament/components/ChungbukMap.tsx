'use client';

import { useEffect, useRef, useState } from 'react';
import type { RegionCode } from '@/constants/regions';
import { haptic } from '@/lib/haptic';
import type { Destination, TournamentTheme } from '@/features/tournament/types';
import styles from './ChungbukMap.module.scss';

/**
 * 충북 지도 + 풀(여행지) 표시 + 다중 선택.
 *
 * 배경: public/images/chungbuk-final-map.svg 를 inline embed.
 *   - fetch → 내장 <style> 제거 → dangerouslySetInnerHTML
 *   - 외부 CSS module 의 :global 선택자로 path/text 색상 컨트롤
 *   - CSS variable 로 light/dark 톤 분기 (prefers-color-scheme)
 *   - path.region 에 hover/click 이벤트 직접 부착 (useEffect + ref)
 *
 * 좌표(POINTS): SVG <text class="label"> 의 viewBox 좌표를 0~100 정규화.
 */

const SVG_URL = '/images/chungbuk-final-map.svg';

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
  const perRegion = new Map<RegionCode, number>();
  return destinations.map((d, i) => {
    const region = d.region as RegionCode;
    const base = POINTS[region] ?? { x: 50, y: 50 };
    const idx = perRegion.get(region) ?? 0;
    perRegion.set(region, idx + 1);

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
  selected?: Set<string>;
  onToggle?: (id: string) => void;
  maxSelect?: number;
  onReady?: () => void;
  /**
   * 시군 path 클릭 콜백 — path 의 한글 id (예: '청주시 상당구', '괴산군') 전달.
   * 미전달 시 path 클릭 효과 비활성 (cursor default).
   */
  onRegionClick?: (regionName: string) => void;
}

export function ChungbukMap({
  destinations,
  theme,
  selected,
  onToggle,
  maxSelect,
  onReady,
  onRegionClick,
}: ChungbukMapProps) {
  const [placed] = useState<Placed[]>(() => placeAll(destinations));
  const [svg, setSvg] = useState<string | null>(null);
  const svgWrapRef = useRef<HTMLDivElement>(null);
  const glyph = getGlyph(theme);
  const selectable = !!selected && !!onToggle;

  // SVG fetch + 내장 <style> 제거 (외부 CSS variable 로 컨트롤)
  useEffect(() => {
    let cancelled = false;
    fetch(SVG_URL)
      .then((r) => r.text())
      .then((text) => {
        if (cancelled) return;
        const stripped = text.replace(/<style[\s\S]*?<\/style>/g, '');
        setSvg(stripped);
      })
      .catch(() => {
        // network 오류 — fallback 없음 (지도 없이 drop 만 표시되도록)
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // path.region 에 click 이벤트 부착
  useEffect(() => {
    if (!svgWrapRef.current || !svg) return;
    const root = svgWrapRef.current;
    const paths = root.querySelectorAll<SVGPathElement>('path.region');
    if (paths.length === 0) return;
    const cleanups: Array<() => void> = [];
    paths.forEach((p) => {
      const handler = () => {
        if (!onRegionClick) return;
        haptic.tap();
        onRegionClick(p.id);
      };
      p.addEventListener('click', handler);
      p.style.cursor = onRegionClick ? 'pointer' : 'default';
      cleanups.push(() => p.removeEventListener('click', handler));
    });
    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, [svg, onRegionClick]);

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
      <div
        ref={svgWrapRef}
        className={styles.svgWrap}
        // SVG 는 우리 정적 파일(public/images/chungbuk-final-map.svg) 이라 신뢰 가능.
        // 내장 <style> 만 제거하고 path/text 가 외부 CSS 로 cascade 되도록.
        dangerouslySetInnerHTML={{ __html: svg ?? '' }}
        aria-label="충청북도 지도"
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
