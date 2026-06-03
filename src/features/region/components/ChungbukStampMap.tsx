'use client';

import { useEffect, useRef, useState } from 'react';
import { CHUNGBUK_REGIONS, type RegionCode } from '@/constants/regions';
import styles from './ChungbukStampMap.module.scss';

/**
 * 도장책 정밀 지도 — 토너먼트의 `ChungbukMap` SVG (public/images/chungbuk-final-map.svg)
 * 를 재사용. visited 시군의 path.region 에 data-visited 속성을 부여하면
 * CSS module 의 :global 셀렉터가 fill 을 도장 색으로 override.
 *
 * 동작:
 *   1) SVG fetch → 내장 <style> 제거 (외부 CSS variable 로 컨트롤)
 *   2) path.region 의 id 첫 단어 (예: '청주시', '보은군') → 시군 한글명
 *   3) visited RegionCode set 의 ko 라벨과 매칭 → path 에 data-visited="true"
 *   4) 클릭 시 onRegionClick(code) — 시군 상세 이동 / 도장 동작
 *
 * 청주시가 4 개 path 로 쪼개져 있어 같은 그룹 키의 path 모두에 attr 동시 부여.
 */

const SVG_URL = '/images/chungbuk-final-map.svg';

const KO_TO_CODE: Record<string, RegionCode> = Object.fromEntries(
  CHUNGBUK_REGIONS.map((r) => [r.ko, r.code]),
) as Record<string, RegionCode>;

export function ChungbukStampMap({
  visited,
  onRegionClick,
}: {
  visited: ReadonlySet<RegionCode>;
  onRegionClick?: (code: RegionCode) => void;
}) {
  const [svg, setSvg] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // 1) SVG fetch + 내장 <style> 제거
  useEffect(() => {
    let cancelled = false;
    fetch(SVG_URL)
      .then((r) => r.text())
      .then((text) => {
        if (cancelled) return;
        setSvg(text.replace(/<style[\s\S]*?<\/style>/g, ''));
      })
      .catch(() => {
        /* graceful fallback — null 유지 (지도 미표시) */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 2) path.region 에 data-visited / data-region attr + click handler
  useEffect(() => {
    if (!wrapRef.current || !svg) return;
    const root = wrapRef.current;
    const paths = Array.from(
      root.querySelectorAll<SVGPathElement>('path.region'),
    );
    if (paths.length === 0) return;

    const groupKey = (p: SVGPathElement) => p.id.split(/\s+/)[0] ?? p.id;
    const cleanups: Array<() => void> = [];

    paths.forEach((p) => {
      const ko = groupKey(p);
      const code = KO_TO_CODE[ko];
      if (!code) return;
      p.setAttribute('data-region', code);
      if (visited.has(code)) {
        p.setAttribute('data-visited', 'true');
      } else {
        p.removeAttribute('data-visited');
      }
      p.style.cursor = onRegionClick ? 'pointer' : 'default';

      if (onRegionClick) {
        const onClick = () => onRegionClick(code);
        p.addEventListener('click', onClick);
        cleanups.push(() => p.removeEventListener('click', onClick));
      }
    });

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, [svg, visited, onRegionClick]);

  return (
    <div
      ref={wrapRef}
      className={styles.wrap}
      // SVG 는 신뢰 가능한 자체 static asset
      dangerouslySetInnerHTML={{ __html: svg ?? '' }}
      role="group"
      aria-label="충북 11개 시군 도장책"
    />
  );
}
