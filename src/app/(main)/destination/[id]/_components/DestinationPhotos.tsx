'use client';

import Image from 'next/image';
import { Carousel } from '@/features/carousel';
import { secureImageUrl } from '@/lib/secure-image-url';
import styles from './DestinationPhotos.module.scss';

/**
 * 여행지 상단 사진 영역 — Figma "POI · 장소상세 hero" (2026-06-23) 정합.
 *
 * spec:
 *   - 360×234 fixed height. bg image + #A8B29C fallback.
 *   - hero-ov overlay: linear-gradient 0deg rgba(0,0,0,0.2) 합성 + 180deg
 *     gradient (0% → 64% 0.08 → 100% 0.5) 텍스트 가독성 + 하단 dim.
 *   - hero-dots absolute bottom 14 center — Carousel 의 dots default 위치는
 *     아래로 빠지는데, 본 화면은 dots 가 사진 안 overlay 위치 — Carousel
 *     primitive 의 dots 위치 변경은 다른 페이지 영향 → photos wrap 자체에
 *     아래 padding 0 으로 두고 dots margin-top 음수 (-22) 로 끌어올림.
 *
 * 표시 우선 순위:
 *   1) photos[] 1+ 장 → carousel
 *   2) imageUrl 만 → 단일 hero (priority Image, LCP)
 *   3) 둘 다 없음 → null
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
        <div className={styles.overlay} aria-hidden />
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
        fallbackHeight={234}
        ariaLabel={alt}
      />
      <div className={styles.overlay} aria-hidden />
    </div>
  );
}
