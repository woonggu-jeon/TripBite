'use client';

import { Carousel } from '@/features/carousel';
import styles from './DestinationPhotos.module.scss';

/**
 * 여행지 상단 사진 캐러셀.
 *
 * - photos 가 없으면 null (graceful) — 호출처에서 분기 X.
 * - mock 은 SVG data URL placeholder 3장 (id 기반 hue). 실 BE 는 CDN URL.
 * - aspect-ratio 고정으로 CLS 0.
 * - 캐러셀 dots 노출 (사진 수 < 4 일 때 의미 있음).
 */
export function DestinationPhotos({
  photos,
  alt,
}: {
  photos: readonly string[] | undefined;
  alt: string;
}) {
  if (!photos || photos.length === 0) return null;

  return (
    <div className={styles.wrap}>
      <Carousel
        slides={[...photos]}
        keyExtractor={(_, i) => i}
        renderSlide={(src, i) => (
          // SVG data URL placeholder (mock) — alt 외부 prop. lazy 는 첫 외 모두.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={`${alt} ${i + 1}`}
            loading={i === 0 ? 'eager' : 'lazy'}
            className={styles.image}
            draggable={false}
          />
        )}
        options={{ slidesPerView: 1, gap: 0 }}
        showDots={photos.length > 1}
        fallbackHeight={240}
        ariaLabel={alt}
      />
    </div>
  );
}
