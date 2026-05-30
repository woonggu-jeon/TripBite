'use client';

import { useCallback, useRef, useState, type ReactNode } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, FreeMode } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper/types';
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
 * Carousel 구현 — Swiper.js v12 (React component).
 *
 * embla/keen-slider 에서 옮긴 이유:
 *   두 lib 모두 base CSS .slide { width: 100% } + lib mount 후 inline width
 *   주입 패턴. iOS Safari + dynamic import 환경에서 첫 ResizeObserver miss
 *   시 stuck. Swiper 는 mount 시 inline style 로 width 처리 + ResizeObserver
 *   + window.resize + RAF 다중 fallback 으로 검증됨.
 *
 * 자체 dots/arrows 유지 (디자인 일관성). Pagination/Navigation 모듈 미사용 —
 * onSwiper 로 instance 받아 직접 slidePrev/slideNext/slideTo.
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
  const dragFree = options?.dragFree ?? false;
  const startIndex = options?.startIndex ?? 0;

  const [selectedIndex, setSelectedIndex] = useState(startIndex);
  const swiperRef = useRef<SwiperType | null>(null);
  const slidesCount = slides.length;

  const handleSwiper = useCallback((s: SwiperType) => {
    swiperRef.current = s;
  }, []);

  const handleSlideChange = useCallback((s: SwiperType) => {
    setSelectedIndex(s.realIndex);
  }, []);

  const scrollPrev = useCallback(() => swiperRef.current?.slidePrev(), []);
  const scrollNext = useCallback(() => swiperRef.current?.slideNext(), []);
  const scrollTo = useCallback((i: number) => {
    const s = swiperRef.current;
    if (!s) return;
    // loop 모드에선 slideToLoop 가 자연스러운 wrap 이동, 아니면 slideTo
    if (s.params.loop) s.slideToLoop(i);
    else s.slideTo(i);
  }, []);

  const modules = autoplayMs
    ? dragFree
      ? [Autoplay, FreeMode]
      : [Autoplay]
    : dragFree
      ? [FreeMode]
      : [];

  return (
    <div
      className={styles.root}
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
    >
      <Swiper
        modules={modules}
        slidesPerView={slidesPerView}
        spaceBetween={gap}
        loop={loop}
        initialSlide={startIndex}
        freeMode={dragFree}
        autoplay={
          autoplayMs
            ? {
                delay: autoplayMs,
                disableOnInteraction: true,
                pauseOnMouseEnter: true,
              }
            : false
        }
        onSwiper={handleSwiper}
        onSlideChange={handleSlideChange}
        className={styles.swiperRoot}
        // 마우스 휠/터치 둘 다 동작 — swiper 의 기본 grab 커서
        grabCursor
        // 사용자 인터랙션 안 막음 (a11y)
        a11y={{ enabled: true }}
      >
        {slides.map((item, i) => (
          <SwiperSlide
            key={keyExtractor?.(item, i) ?? i}
            className={styles.slide}
            aria-label={t('slide', { n: i + 1, total: slidesCount })}
          >
            {renderSlide(item, i)}
          </SwiperSlide>
        ))}
      </Swiper>

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
