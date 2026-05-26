'use client';

import { type ReactNode } from 'react';
import { clientOnly } from '@/lib/dynamic';
import { Skeleton } from '@/components/feedback/Skeleton';
import type { CarouselOptions } from '@/features/carousel/types';

export type CarouselProps<T> = {
  slides: T[];
  renderSlide: (item: T, index: number) => ReactNode;
  keyExtractor?: (item: T, index: number) => string | number;
  options?: CarouselOptions;
  showDots?: boolean;
  showArrows?: boolean;
  ariaLabel?: string;
  /** 로딩 중 skeleton 높이 */
  fallbackHeight?: number;
};

/**
 * <Carousel />
 *
 * Embla 캐러셀의 SSR-disabled wrapper.
 *
 * 사용:
 *   <Carousel
 *     slides={recommendations}
 *     renderSlide={(item) => <HeroCard item={item} />}
 *     keyExtractor={(item) => item.id}
 *     options={{ loop: true, autoplayMs: 4000, slidesPerView: 1, gap: 16 }}
 *     showDots
 *     ariaLabel="추천 여행지"
 *   />
 *
 * 성능:
 *   - embla 코드는 별도 청크 (~10KB gzipped)
 *   - 로딩 동안 Skeleton 표시 (레이아웃 시프트 0)
 *   - transform 기반 60fps 슬라이드
 *   - 자동재생 사용 시 사용자 인터랙션으로 자동 일시정지
 */
const CarouselLazy = clientOnly(
  () => import('./CarouselImpl'),
  {
    loading: () => null, // 아래 함수형 wrapper 에서 skeleton 처리
  },
);

export function Carousel<T>(props: CarouselProps<T>) {
  // type 호환을 위해 unknown으로 강제 캐스팅 — CarouselImpl 은 제네릭이지만
  // dynamic import 결과에 제네릭을 보존할 수 없어 호출부에서 타입 보장.
  const Impl = CarouselLazy as unknown as React.ComponentType<CarouselProps<T>>;

  return (
    <div style={{ position: 'relative' }}>
      {/* 초기 로드 동안 자리 잡이 — fallbackHeight 지정 시 사용 */}
      {props.fallbackHeight && (
        <Skeleton
          width="100%"
          height={props.fallbackHeight}
          radius="lg"
          className="carousel-skeleton-fallback"
        />
      )}
      <Impl {...props} />
    </div>
  );
}
