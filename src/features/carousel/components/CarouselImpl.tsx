'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useKeenSlider, type KeenSliderInstance } from 'keen-slider/react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import 'keen-slider/keen-slider.min.css';
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
 * Carousel 실제 구현 (keen-slider)
 *
 * embla 에서 교체 — iOS Safari 스크롤 중 카드 텍스트/이미지 layer tile
 * eviction 깜박임. keen-slider 는 슬라이드별 own DOM + lighter compositing.
 *
 * 자동재생은 keen-slider plugin 패턴으로 inline 구현 (사용자 인터랙션 시 정지).
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
  const dragFree = options?.dragFree ?? false;
  const startIndex = options?.startIndex ?? 0;
  const autoplayMs = options?.autoplayMs;

  const [selectedIndex, setSelectedIndex] = useState(startIndex);
  const slidesCount = slides.length;

  // autoplay 를 ref 로 두어 옵션 변경 시 hook 의 deps 가 안 흔들리도록 격리
  const autoplayMsRef = useRef(autoplayMs);
  useEffect(() => {
    autoplayMsRef.current = autoplayMs;
  }, [autoplayMs]);

  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>(
    {
      loop,
      mode: dragFree ? 'free-snap' : 'snap',
      initial: startIndex,
      slides: { perView: slidesPerView, spacing: gap },
      slideChanged(s) {
        setSelectedIndex(s.track.details.rel);
      },
    },
    [
      // autoplay plugin
      (slider) => {
        let timeout: ReturnType<typeof setTimeout> | undefined;
        let stopped = false;
        const clear = () => {
          if (timeout) clearTimeout(timeout);
          timeout = undefined;
        };
        const next = () => {
          clear();
          const ms = autoplayMsRef.current;
          if (!ms || stopped) return;
          if (slider.track.details.slides.length < 2) return;
          timeout = setTimeout(() => slider.next(), ms);
        };
        slider.on('created', next);
        slider.on('animationEnded', next);
        slider.on('updated', next);
        slider.on('dragStarted', () => {
          stopped = true;
          clear();
        });
        slider.on('detailsChanged', next);
      },
    ],
  );

  // slidesPerView / gap / loop 변경 시 keen-slider 측정값 갱신
  useEffect(() => {
    instanceRef.current?.update({
      loop,
      mode: dragFree ? 'free-snap' : 'snap',
      initial: startIndex,
      slides: { perView: slidesPerView, spacing: gap },
    });
  }, [instanceRef, slidesPerView, gap, loop, dragFree, startIndex]);

  const scrollPrev = useCallback(
    () => instanceRef.current?.prev(),
    [instanceRef],
  );
  const scrollNext = useCallback(
    () => instanceRef.current?.next(),
    [instanceRef],
  );
  const scrollTo = useCallback(
    (i: number) => instanceRef.current?.moveToIdx(i),
    [instanceRef],
  );

  const dots = useMemo(
    () => Array.from({ length: slidesCount }, (_, i) => i),
    [slidesCount],
  );

  return (
    <div
      className={styles.root}
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
    >
      <div ref={sliderRef} className={`keen-slider ${styles.viewport}`}>
        {slides.map((item, i) => (
          <div
            key={keyExtractor?.(item, i) ?? i}
            className={`keen-slider__slide ${styles.slide}`}
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
          {dots.map((i) => (
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

// 일부 keen-slider 타입은 lib 자체에서 export 되지만, 사용 안 함을 명시.
export type { KeenSliderInstance };
