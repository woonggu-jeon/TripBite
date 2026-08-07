'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CHUNGBUK_REGIONS, type RegionCode } from '@/constants/regions';
import { haptic } from '@/lib/haptic';
import { Illustration } from '@/components/brand/Illustration';
import { seasonIllustration } from '@/constants/illustration-map';
import type { DestinationDto } from '@/types/api-domain';
import type { TournamentTheme } from '@/features/tournament/types';
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

/**
 * 지도 마커 그림 — Figma `여행지 준비 완료` 는 36px `seasonIcon` 을 쓴다.
 * 구 구현은 OS 이모지(🌸 💧 🍂 ❄️) 여서 계절 카드·로딩 화면의 아이콘과
 * 달랐다 (특히 여름이 시안의 태양이 아니라 빗방울).
 */
function seasonMarker(theme: TournamentTheme) {
  const art = seasonIllustration(theme.value);
  return art ? <Illustration name={art} size={36} /> : null;
}

interface Placed {
  id: string;
  name: string;
  x: number;
  y: number;
  delay: number;
}

function placeAll(destinations: DestinationDto[]): Placed[] {
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
  destinations: DestinationDto[];
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
  // ⚠ useState initializer 로 두면 destinations prop 이 refetch 등으로 바뀌어도
  // mount 시점 값만 유지돼 시각이 그대로 — 다시하기 버튼이 무동작처럼 보임.
  // useMemo 로 destinations 변경 시 즉시 재계산.
  const placed = useMemo<Placed[]>(
    () => placeAll(destinations),
    [destinations],
  );

  // 같은 element 에 CSS animation 이 걸려 있으면 좌표/delay 가 inline style 로 바뀌어도
  // animation 자체는 reset 되지 않음 — 다시하기 시 "내려오는 효과" 가 보이지 않음.
  // destinations id 시퀀스를 nonce 로 묶어 overlay 컨테이너 key 갱신 → 자식 button/span
  // 들이 unmount/remount → animation 처음부터 다시 재생.
  const placedNonce = useMemo(
    () => destinations.map((d) => d.id).join('|'),
    [destinations],
  );
  const [svg, setSvg] = useState<string | null>(null);
  const svgWrapRef = useRef<HTMLDivElement>(null);
  const marker = seasonMarker(theme);
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

  // path.region 에 click + 시군 그룹 hover 동기화
  //
  // 충북 SVG 는 청주시가 4 개 path("청주시 상당구/서원구/청원구/흥덕구") 로 쪼개져 있어
  // 개별 path :hover 만 쓰면 하나의 시군이 4 조각으로 hover 됨.
  // path id 의 첫 단어(예: '청주시', '괴산군')를 그룹 키로 묶어 mouseenter/leave 시
  // 같은 그룹의 모든 path 에 .is-region-hovered 클래스를 토글 → 하나로 hover 보임.
  //
  // click 도 시군 단위로 통합 — onRegionClick 에는 그룹 키(예: '청주시') 전달.
  useEffect(() => {
    if (!svgWrapRef.current || !svg) return;
    const root = svgWrapRef.current;
    const paths = Array.from(
      root.querySelectorAll<SVGPathElement>('path.region'),
    );
    if (paths.length === 0) return;

    const groupKey = (p: SVGPathElement) => p.id.split(/\s+/)[0] ?? p.id;
    const groupMap = new Map<string, SVGPathElement[]>();
    paths.forEach((p) => {
      const key = groupKey(p);
      const arr = groupMap.get(key) ?? [];
      arr.push(p);
      groupMap.set(key, arr);
    });

    // Figma `cbmap` — 뽑힌 시군은 연초록 면 + 초록 테두리, 라벨도 초록.
    // (markers 의 계절 아이콘과 함께 두 겹으로 표시)
    const pickedKo = new Set<string>(
      destinations
        .map<
          string | undefined
        >((d) => CHUNGBUK_REGIONS.find((r) => r.code === d.region)?.ko)
        .filter((ko): ko is string => typeof ko === 'string'),
    );
    paths.forEach((p) => {
      if (pickedKo.has(groupKey(p))) p.setAttribute('data-picked', 'true');
      else p.removeAttribute('data-picked');
    });
    root.querySelectorAll<SVGTextElement>('text.label').forEach((label) => {
      const ko = (label.textContent ?? '').trim().split(/\s+/)[0] ?? '';
      if (pickedKo.has(ko)) label.setAttribute('data-picked', 'true');
      else label.removeAttribute('data-picked');
    });

    const cleanups: Array<() => void> = [];
    paths.forEach((p) => {
      const key = groupKey(p);
      const siblings = groupMap.get(key) ?? [p];
      const enter = () =>
        siblings.forEach((s) => s.classList.add('is-region-hovered'));
      const leave = () =>
        siblings.forEach((s) => s.classList.remove('is-region-hovered'));
      const click = () => {
        if (!onRegionClick) return;
        haptic.tap();
        onRegionClick(key);
      };
      p.addEventListener('mouseenter', enter);
      p.addEventListener('mouseleave', leave);
      p.addEventListener('click', click);
      p.style.cursor = onRegionClick ? 'pointer' : 'default';
      cleanups.push(() => {
        p.removeEventListener('mouseenter', enter);
        p.removeEventListener('mouseleave', leave);
        p.removeEventListener('click', click);
      });
    });
    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, [svg, onRegionClick, destinations]);

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

      <div key={placedNonce} className={styles.overlay}>
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
                {marker}
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
              {marker}
            </span>
          );
        })}
      </div>
    </div>
  );
}
