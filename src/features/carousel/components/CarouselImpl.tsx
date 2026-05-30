'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CarouselOptions } from '@/features/carousel/types';
import styles from './Carousel.module.scss';

export type CarouselImplProps<T> = {
  slides: T[];
  renderSlide: (item: T, index: number) => ReactNode;
  keyExtractor?: (item: T, index: number) => string | number;
  options?: CarouselOptions;
  showDots?: boolean;
  showArrows?: boolean;
  ariaLabel?: string;
};

/**
 * Carousel 구현 — 네이티브 overflow-x:auto + scroll-snap-type.
 *
 * 왜 라이브러리(embla/keen-slider)를 뺐나:
 *   두 lib 모두 base CSS 의 .slide { width: 100% } + lib mount 후 inline
 *   width 주입 패턴. iOS Safari + dynamic import 환경에서 첫 ResizeObserver
 *   miss 시 slide 폭이 100% 로 stuck → 카드 1장이 viewport 가득 차지하는
 *   증상 반복. 네이티브 스크롤은 lib mount 개념 자체가 없어 stuck 불가능.
 *
 * 잃는 것:
 *   - 무거운 drag 휠 효과 (네이티브 momentum 으로 충분)
 *   - 무한 loop (autoplay 마지막에서 첫 카드로 jump 으로 대체)
 *   - free-snap 모드 (mandatory snap 만 — 사용처에 맞음)
 */
export default function CarouselImpl<T>({
  slides,
  renderSlide,
  keyExtractor,
  options,
  showDots = true,
  showArrows = false,
  ariaLabel,
}: CarouselImplProps<T>) {
  const t = useTranslations('carousel');

  const slidesPerView = options?.slidesPerView ?? 1;
  const gap = options?.gap ?? 12;
  const loop = options?.loop ?? false;
  const autoplayMs = options?.autoplayMs;
  const startIndex = options?.startIndex ?? 0;

  const trackRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(startIndex);
  const slidesCount = slides.length;

  // stride = 슬라이드 폭 + gap. handleScroll/autoplay/scrollTo 공용 계산.
  const getStride = useCallback(() => {
    const el = trackRef.current;
    if (!el) return 0;
    return (el.clientWidth - gap * (slidesPerView - 1)) / slidesPerView + gap;
  }, [gap, slidesPerView]);

  // 시작 index 로 즉시 이동 (mount 후 한 번만)
  useEffect(() => {
    const el = trackRef.current;
    if (!el || startIndex === 0) return;
    el.scrollLeft = getStride() * startIndex;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // scroll 시 active dot 계산 (rAF throttle)
  const rafRef = useRef<number | null>(null);
  const handleScroll = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const el = trackRef.current;
      if (!el) return;
      const stride = getStride();
      if (stride <= 0) return;
      const idx = Math.round(el.scrollLeft / stride);
      setSelectedIndex(Math.max(0, Math.min(slidesCount - 1, idx)));
    });
  }, [getStride, slidesCount]);

  // autoplay — 사용자 포인터 인터랙션 시 일시정지
  useEffect(() => {
    if (!autoplayMs) return;
    const el = trackRef.current;
    if (!el) return;

    let paused = false;
    const onPointerDown = () => {
      paused = true;
    };
    el.addEventListener('pointerdown', onPointerDown, { passive: true });

    const id = window.setInterval(() => {
      if (paused) return;
      const stride = getStride();
      if (stride <= 0) return;
      const max = el.scrollWidth - el.clientWidth;
      if (loop && el.scrollLeft + stride > max - 1) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else if (el.scrollLeft + stride > max) {
        return; // loop 아니면 끝에서 정지
      } else {
        el.scrollBy({ left: stride, behavior: 'smooth' });
      }
    }, autoplayMs);

    return () => {
      window.clearInterval(id);
      el.removeEventListener('pointerdown', onPointerDown);
    };
  }, [autoplayMs, loop, getStride]);

  const scrollPrev = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: -getStride(), behavior: 'smooth' });
  }, [getStride]);
  const scrollNext = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: getStride(), behavior: 'smooth' });
  }, [getStride]);
  const scrollTo = useCallback(
    (i: number) => {
      const el = trackRef.current;
      if (!el) return;
      el.scrollTo({ left: getStride() * i, behavior: 'smooth' });
    },
    [getStride],
  );

  const trackStyle = {
    '--carousel-spv': slidesPerView,
    '--carousel-gap': `${gap}px`,
    gap: `${gap}px`,
  } as React.CSSProperties;

  return (
    <div
      className={styles.root}
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
    >
      <div
        ref={trackRef}
        className={styles.track}
        style={trackStyle}
        onScroll={handleScroll}
      >
        {slides.map((item, i) => (
          <div
            key={keyExtractor?.(item, i) ?? i}
            className={styles.slide}
            aria-roledescription="slide"
            aria-label={t('slide', { n: i + 1, total: slidesCount })}
          >
            {renderSlide(item, i)}
          </div>
        ))}
      </div>

      {showArrows && (
        <>
          <button
            type="button"
            aria-label={t('prev')}
            className={`${styles.arrow} ${styles.prev}`}
            onClick={scrollPrev}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            aria-label={t('next')}
            className={`${styles.arrow} ${styles.next}`}
            onClick={scrollNext}
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {showDots && slidesCount > 1 && (
        <div className={styles.dots} role="tablist">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === selectedIndex}
              aria-label={t('slide', { n: i + 1, total: slidesCount })}
              className={`${styles.dot} ${i === selectedIndex ? styles.dotActive : ''}`}
              onClick={() => scrollTo(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
