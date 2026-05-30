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
    },
    plugins,
  );

  const [selectedIndex, setSelectedIndex] = useState(options?.startIndex ?? 0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    onSelect();
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  // slidesPerView / gap 변경 시 embla 내부 측정값(snap point, slideSizes) 갱신.
  // flex-basis inline style 만 바뀌면 컨테이너 width 가 그대로라 ResizeObserver
  // 가 못 잡음 → 스와이프 시 옛 폭 기준으로 스냅돼 어긋남/깜빡임 발생.
  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.reInit();
  }, [emblaApi, options?.slidesPerView, options?.gap]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback(
    (i: number) => emblaApi?.scrollTo(i),
    [emblaApi],
  );

  const slidesPerView = options?.slidesPerView ?? 1;
  const gap = options?.gap ?? 12;

  return (
    <div
      className={styles.root}
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
    >
      <div className={styles.viewport} ref={emblaRef}>
        <div className={styles.container} style={{ gap }}>
          {slides.map((item, i) => (
            <div
              key={keyExtractor?.(item, i) ?? i}
              className={styles.slide}
              style={{
                flex: `0 0 calc((100% - ${gap * (slidesPerView - 1)}px) / ${slidesPerView})`,
              }}
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
        <div className={styles.dots} role="tablist">
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
