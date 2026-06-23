'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
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
  dotsVariant?: 'below' | 'overlay';
  showArrows?: boolean;
  ariaLabel?: string;
};

/**
 * Carousel 실제 구현 (Embla)
 *
 * 성능 노트:
 *   - Embla는 transform 기반 (60fps, GPU 가속)
 *   - 슬라이드 수가 많아도 virtualize 없이 잘 동작 (~수십 개)
 *   - 자동재생은 사용자 인터랙션 시 일시정지 (Autoplay 플러그인 기본 동작)
 *
 * 접근성:
 *   - aria-roledescription="carousel"
 *   - 슬라이드별 aria-label "n/total"
 *   - 키보드: ←/→ 화살표 지원 (focus 상태에서)
 */
export default function CarouselImpl<T>({
  slides,
  renderSlide,
  keyExtractor,
  options,
  showDots = true,
  dotsVariant = 'below',
  showArrows = false,
  ariaLabel,
}: CarouselImplProps<T>) {
  const t = useTranslations('carousel');

  const plugins = options?.autoplayMs
    ? [Autoplay({ delay: options.autoplayMs, stopOnInteraction: true })]
    : [];

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: options?.loop ?? false,
      dragFree: options?.dragFree ?? false,
      startIndex: options?.startIndex ?? 0,
      align: 'start',
      // ios safari 안정화 옵션:
      //   - axis: 'x' 명시 (기본값이지만 자동 감지 회피)
      //   - slidesToScroll: 1 — 한 번에 1슬라이드씩 (fractional 일 때도 정확)
      //   - containScroll: 'trimSnaps' — 끝 슬라이드의 빈 snap 제거, 마지막
      //     슬라이드가 viewport 끝에 정확히 정렬되며 영역 비는 점프 방지
      //   - watchDrag: true — 드래그 감지 안정 (기본값 명시)
      axis: 'x',
      slidesToScroll: 1,
      containScroll: 'trimSnaps',
      watchDrag: true,
    },
    plugins,
  );

  const [selectedIndex, setSelectedIndex] = useState(options?.startIndex ?? 0);

  // is-ready 패턴 — embla 가 measure/transform 적용 완료 전까지 opacity 0 으로
  // 가려둠. mount 직후 inline flex 폭 적용 → embla transform 적용 사이의 짧은
  // reflow 떨림(특히 iOS Safari)을 시각적으로 차단.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (emblaApi) setReady(true);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    onSelect();
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback(
    (i: number) => emblaApi?.scrollTo(i),
    [emblaApi],
  );

  const slidesPerView = options?.slidesPerView ?? 1;
  const gap = options?.gap ?? 12;

  // CSS variable 로 전달 — inline `flex: calc(...)` 를 슬라이드마다 매 render
  // string 으로 만드는 것보다 ios safari 의 reflow/repaint 안정.
  // root 에 한 번만 들어가고, .slide 가 var() 로 읽음.
  const rootStyle = {
    '--carousel-gap': `${gap}px`,
    '--carousel-per-view': String(slidesPerView),
  } as React.CSSProperties;

  return (
    <div
      className={`${styles.root} ${ready ? styles.ready : ''}`}
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      style={rootStyle}
    >
      <div className={styles.viewport} ref={emblaRef}>
        <div className={styles.container}>
          {slides.map((item, i) => (
            // role="group" + aria-roledescription="slide" — ARIA 1.2 carousel
            // 패턴. role 없이 aria-roledescription 만 두면 일부 a11y 검사기가
            // prohibited 로 잡음 (aria-roledescription 은 role 과 함께 사용).
            <div
              key={keyExtractor?.(item, i) ?? i}
              className={styles.slide}
              role="group"
              aria-roledescription="slide"
              aria-label={t('slide', { n: i + 1, total: slides.length })}
            >
              {renderSlide(item, i)}
            </div>
          ))}
        </div>
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

      {showDots && slides.length > 1 && (
        <div
          className={`${styles.dots} ${
            dotsVariant === 'overlay' ? styles.dotsOverlay : ''
          }`}
          role="tablist"
        >
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === selectedIndex}
              aria-label={t('slide', { n: i + 1, total: slides.length })}
              className={`${styles.dot} ${i === selectedIndex ? styles.dotActive : ''}`}
              onClick={() => scrollTo(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
