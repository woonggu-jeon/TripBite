'use client';

import { useEffect, useState } from 'react';

/**
 * Carousel slidesPerView 를 viewport 폭에 따라 동적으로 결정.
 *
 * Breakpoints (default):
 *   ≤ 360 → 1.8 (S8 등 소형 모바일)
 *   ≤ 480 → 2.2 (일반 모바일)
 *    그 외 → 3 (태블릿/데스크탑)
 *
 * 사용:
 *   const slidesPerView = useResponsiveSlidesPerView();
 *   <Carousel options={{ slidesPerView, gap: 8 }} ... />
 *
 * 커스텀 breakpoint 도 props 로 받을 수 있게 두 번째 인자 지원.
 * SSR 안전 — window 미정의 시 fallback 사용 후 mount 시 실제 값으로 sync.
 */
export type SlidesPerViewBreakpoint = {
  /** viewport 이 이 width 이하일 때 적용할 slidesPerView 값 */
  maxWidth: number;
  value: number;
};

const DEFAULT_BREAKPOINTS: SlidesPerViewBreakpoint[] = [
  { maxWidth: 360, value: 1.8 },
  { maxWidth: 480, value: 2.2 },
];

const DEFAULT_FALLBACK = 3;

function pick(w: number, bps: SlidesPerViewBreakpoint[], fallback: number) {
  for (const bp of bps) {
    if (w <= bp.maxWidth) return bp.value;
  }
  return fallback;
}

export function useResponsiveSlidesPerView(
  breakpoints: SlidesPerViewBreakpoint[] = DEFAULT_BREAKPOINTS,
  fallback: number = DEFAULT_FALLBACK,
) {
  const [v, setV] = useState(() =>
    typeof window === 'undefined'
      ? 2.2
      : pick(window.innerWidth, breakpoints, fallback),
  );
  useEffect(() => {
    const onResize = () => {
      const next = pick(window.innerWidth, breakpoints, fallback);
      setV((prev) => (prev === next ? prev : next));
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoints, fallback]);
  return v;
}
