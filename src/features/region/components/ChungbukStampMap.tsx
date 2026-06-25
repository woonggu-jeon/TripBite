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
  const [fetchError, setFetchError] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // 1) SVG fetch + 내장 <style> 제거 + 실패 시 사용자 안내 (silent fail 회피).
  useEffect(() => {
    let cancelled = false;
    setFetchError(false);
    fetch(SVG_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`status ${r.status}`);
        return r.text();
      })
      .then((text) => {
        if (cancelled) return;
        setSvg(text.replace(/<style[\s\S]*?<\/style>/g, ''));
      })
      .catch(() => {
        if (!cancelled) setFetchError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 2) path.region 에 data-visited / data-region attr + click handler.
  //    SVG path 에 id 없음 (`class="region" d="..."` 만). text.label 도
  //    textContent 만. mount 후 path bbox center 와 가장 가까운 label (시군명)
  //    매칭 → 모든 path/label 에 `data-region` 한글명 attr 부여. 청주시 4 path
  //    (상당/서원/청원/흥덕) 모두 청주 label 인접성으로 청주시 매핑됨 (사용자
  //    명시 2026-06-25 — 도장책 색칠 fix, ChungbukMap 과 동일 패턴).
  useEffect(() => {
    if (!wrapRef.current || !svg) return;
    const root = wrapRef.current;
    const paths = Array.from(
      root.querySelectorAll<SVGPathElement>('path.region'),
    );
    const labels = Array.from(
      root.querySelectorAll<SVGTextElement>('text.label'),
    );
    const labelInfo = labels
      .map((el) => ({
        x: parseFloat(el.getAttribute('x') ?? '0'),
        y: parseFloat(el.getAttribute('y') ?? '0'),
        text: (el.textContent ?? '').trim(),
        el,
      }))
      .filter((l) => l.text);
    if (labelInfo.length === 0 || paths.length === 0) return;

    // label 에 data-region (RegionCode) — visited cascade 용. text 자체에는
    // 한글 이름 textContent. label 자체는 1:1 매핑이라 직접 ko.
    labelInfo.forEach((l) => {
      const code = KO_TO_CODE[l.text];
      if (code) l.el.setAttribute('data-region', code);
    });

    // 각 path 의 bbox center 와 가장 가까운 label 의 시군명 → RegionCode.
    paths.forEach((p) => {
      const bbox = p.getBBox();
      const cx = bbox.x + bbox.width / 2;
      const cy = bbox.y + bbox.height / 2;
      let nearestText = '';
      let minDist = Infinity;
      labelInfo.forEach((l) => {
        const d = Math.hypot(cx - l.x, cy - l.y);
        if (d < minDist) {
          minDist = d;
          nearestText = l.text;
        }
      });
      const code = nearestText ? KO_TO_CODE[nearestText] : undefined;
      if (code) p.setAttribute('data-region', code);
    });

    // 청주시는 4 path (상당/서원/청원/흥덕). 1단계 자동 매핑 결과가 'cheongju'
    // 인 path 들 중 거리 가까운 4개만 강제 매핑 (사용자 명시 2026-06-25 — 청주
    // 부자연 fix + hijack 위험 차단). 1단계에서 진천/증평/보은 매핑된 path 는
    // filter out → 인접 시군 path hijack 안 함.
    const cheongjuLabel = labelInfo.find(
      (l) => KO_TO_CODE[l.text] === 'cheongju',
    );
    if (cheongjuLabel) {
      const cl = cheongjuLabel;
      const ranked = paths
        .filter((p) => p.getAttribute('data-region') === 'cheongju')
        .map((p) => {
          const bbox = p.getBBox();
          return {
            path: p,
            dist: Math.hypot(
              bbox.x + bbox.width / 2 - cl.x,
              bbox.y + bbox.height / 2 - cl.y,
            ),
          };
        })
        .sort((a, b) => a.dist - b.dist);
      ranked
        .slice(0, 4)
        .forEach((r) => r.path.setAttribute('data-region', 'cheongju'));
    }
  }, [svg]);

  // 3) visited + click handler — data-region attr 기준 (mount 후 1회 부여됨).
  useEffect(() => {
    if (!wrapRef.current || !svg) return;
    const root = wrapRef.current;
    const paths = Array.from(
      root.querySelectorAll<SVGPathElement>('path.region'),
    );
    const labels = Array.from(
      root.querySelectorAll<SVGTextElement>('text.label'),
    );
    const cleanups: Array<() => void> = [];

    paths.forEach((p) => {
      const code = p.getAttribute('data-region') as RegionCode | null;
      if (!code) return;
      if (visited.has(code)) p.setAttribute('data-visited', 'true');
      else p.removeAttribute('data-visited');
      p.style.cursor = onRegionClick ? 'pointer' : 'default';
      if (onRegionClick) {
        const onClick = () => onRegionClick(code);
        p.addEventListener('click', onClick);
        cleanups.push(() => p.removeEventListener('click', onClick));
      }
    });
    labels.forEach((t) => {
      const code = t.getAttribute('data-region') as RegionCode | null;
      if (!code) return;
      if (visited.has(code)) t.setAttribute('data-visited', 'true');
      else t.removeAttribute('data-visited');
    });

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, [svg, visited, onRegionClick]);

  if (fetchError) {
    return (
      <div className={styles.wrap} role="alert" aria-live="polite">
        <p
          style={{
            padding: 24,
            textAlign: 'center',
            color: 'var(--color-muted)',
            margin: 'auto',
          }}
        >
          지도를 불러오지 못했어요.
        </p>
      </div>
    );
  }
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
