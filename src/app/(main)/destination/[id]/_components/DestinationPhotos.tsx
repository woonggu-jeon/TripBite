'use client';

import Image from 'next/image';
import { Carousel } from '@/features/carousel';
import { secureImageUrl } from '@/lib/secure-image-url';
import styles from './DestinationPhotos.module.scss';

/**
 * 여행지 상단 사진 영역.
 *
 * 표시 우선 순위:
 *   1) photos[] 가 1+ 장 있으면 carousel
 *   2) imageUrl (대표 사진) 만 있으면 단일 hero (carousel X)
 *   3) 둘 다 없으면 null
 *
 * - imageUrl 은 base Destination 의 대표 사진. photos 는 추가 갤러리.
 * - mock 은 SVG data URL placeholder. 실 BE 는 CDN URL.
 * - aspect-ratio 는 wrap 이 정의 (CLS 0). next/image fill 이 그 안 채움.
 * - 단일 hero 만 next/image (LCP 후보 — AVIF/WebP 변환 + priority 적용).
 *   carousel slide 는 raw img 유지 — 각 slide 마다 dimension wrap 추가가 큰 변경.
 */
export function DestinationPhotos({
  photos,
  imageUrl,
  alt,
}: {
  photos: readonly string[] | undefined;
  imageUrl?: string | null;
  alt: string;
}) {
  const safeImageUrl = secureImageUrl(imageUrl);
  const hasGallery = !!photos && photos.length > 0;

  if (!hasGallery && !safeImageUrl) return null;

  if (!hasGallery && safeImageUrl) {
    // 대표 사진 단일 — LCP 후보. next/image fill + priority 로 AVIF/WebP 변환 활용.
    return (
      <div className={styles.wrap}>
        <Image
          src={safeImageUrl}
          alt={alt}
          fill
          priority
          sizes="(max-width: 720px) 100vw, 720px"
          className={styles.image}
          draggable={false}
        />
      </div>
    );
  }

  const slides = photos as readonly string[];
  return (
    <div className={styles.wrap}>
      <Carousel
        slides={[...slides]}
        keyExtractor={(_, i) => i}
        renderSlide={(src, i) => (
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
        showDots={slides.length > 1}
        fallbackHeight={240}
        ariaLabel={alt}
      />
    </div>
  );
}
