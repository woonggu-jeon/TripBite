'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { MapPin } from 'lucide-react';
import { Skeleton } from '@/components/feedback/Skeleton';
import { Carousel } from '@/features/carousel';
import { useRecommendedDestinations } from '@/features/ranking/hooks/use-ranking';
import { CHUNGBUK_REGIONS } from '@/constants/regions';
import { secureImageUrl } from '@/lib/secure-image-url';
import type { DestinationDto } from '@/api/generated/schemas';
import styles from './HomeHero.module.scss';

/**
 * 홈 hero — Figma "HOME · 홈 · hero-block" 스타일을 carousel 로 노출
 * (사용자 명시 2026-06-24 — 단일 카드 → 5-slide swipe carousel 복원).
 *
 * 데이터: useRecommendedDestinations(5) → 5 slides. dot overlay (white).
 * embla 기반 Carousel primitive 사용 (transform 60fps + lazy load + autoplay).
 */
export function HomeHero() {
  const t = useTranslations('home.hero');
  const { data, isLoading } = useRecommendedDestinations(5);

  if (isLoading) {
    return <Skeleton width="100%" height={176} radius="md" />;
  }
  const items = (data ?? []).map((r) => r.destination).slice(0, 5);
  if (items.length === 0) return null;

  return (
    <Carousel
      slides={items}
      renderSlide={(item) => (
        <HeroSlide item={item} eyebrow={t('eyebrow')} title={t('title')} />
      )}
      keyExtractor={(item) => item.id}
      options={{ loop: true, autoplayMs: 5000, slidesPerView: 1, gap: 0 }}
      showDots
      dotsVariant="overlay"
      ariaLabel={t('title')}
      fallbackHeight={176}
    />
  );
}

function HeroSlide({
  item,
  eyebrow,
  title,
}: {
  item: DestinationDto;
  eyebrow: string;
  title: string;
}) {
  const region = CHUNGBUK_REGIONS.find((r) => r.code === item.region);
  const regionKo = region?.ko ?? item.region;
  const safeImg = secureImageUrl(item.imageUrl);
  return (
    <Link
      href={{ pathname: `/destination/${item.id}` }}
      className={styles.hero}
      aria-label={`${item.name} · ${regionKo}`}
    >
      <div className={styles.heroImg} aria-hidden>
        {safeImg && (
          <Image
            src={safeImg}
            alt=""
            fill
            sizes="(max-width: 600px) 100vw, 600px"
            className={styles.heroImage}
            priority
          />
        )}
      </div>
      <div className={styles.heroOverlay} aria-hidden />
      <div className={styles.heroText}>
        <span className={styles.heroEyebrow}>{eyebrow}</span>
        <h2 className={styles.heroTitle}>{title}</h2>
        <span className={styles.heroFooter}>
          <MapPin size={12} aria-hidden />
          <span>
            {regionKo} · {item.name}
          </span>
        </span>
      </div>
    </Link>
  );
}
