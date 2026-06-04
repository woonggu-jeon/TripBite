'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Carousel } from '@/features/carousel';
import { Skeleton } from '@/components/feedback/Skeleton';
import { useRelatedDestinations } from '@/features/tournament/hooks/use-tournament';
import { CHUNGBUK_REGIONS, type RegionCode } from '@/constants/regions';
import type { Destination } from '@/features/tournament/types';
import styles from './RelatedDestinations.module.scss';

/**
 * 이 시군의 다른 여행지 — 메인의 "지금 열리는 충북 축제" 와 동일한 카드 + Carousel UI.
 *
 * 변경 사유: 사용자 요청 — vertical list → 가로 Carousel 의 카드 스와이퍼로 통일.
 * 스타일 자체는 본 module.scss 가 담당 (FestivalCarousel.module.scss 와 같은 룩).
 */

type Slide = {
  destination: Destination;
  emoji: string;
  tone: 'red' | 'amber' | 'green' | 'blue' | 'violet';
  regionLabel: string;
};

const CATEGORY_EMOJI: Record<string, string> = {
  attraction: '📍',
  festival: '🎪',
  experience: '🎨',
  local: '🏘️',
};

// 시군별 톤 — FestivalCarousel 과 동일.
const REGION_TONE: Record<RegionCode, Slide['tone']> = {
  cheongju: 'violet',
  chungju: 'red',
  jecheon: 'blue',
  boeun: 'amber',
  okcheon: 'green',
  yeongdong: 'violet',
  jincheon: 'blue',
  goesan: 'red',
  eumseong: 'amber',
  danyang: 'green',
  jeungpyeong: 'blue',
};

function regionLabelFor(code: RegionCode): string {
  return CHUNGBUK_REGIONS.find((r) => r.code === code)?.ko ?? code;
}

function pickSlidesPerView(w: number) {
  return w <= 360 ? 1.8 : w <= 480 ? 2.2 : 3;
}

function useResponsiveSlidesPerView() {
  const [v, setV] = useState(() =>
    typeof window === 'undefined' ? 2.2 : pickSlidesPerView(window.innerWidth),
  );
  useEffect(() => {
    const onResize = () => {
      const next = pickSlidesPerView(window.innerWidth);
      setV((prev) => (prev === next ? prev : next));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return v;
}

export function RelatedDestinations({ id }: { id: string }) {
  const t = useTranslations('destination.related');
  const slidesPerView = useResponsiveSlidesPerView();
  const { data, isLoading, isError } = useRelatedDestinations(id);

  if (isError) return null;

  if (isLoading) {
    return (
      <section className={styles.wrap} aria-label={t('label')}>
        <h2 className={styles.title}>{t('label')}</h2>
        <Skeleton width="100%" height={200} radius="lg" />
      </section>
    );
  }

  if (!data || data.length === 0) return null;

  const slides: Slide[] = data.map((d) => {
    const region = d.region as RegionCode;
    return {
      destination: d,
      emoji: CATEGORY_EMOJI[d.category] ?? '📍',
      tone: REGION_TONE[region] ?? 'amber',
      regionLabel: regionLabelFor(region),
    };
  });

  return (
    <section className={styles.wrap} aria-label={t('label')}>
      <h2 className={styles.title}>{t('label')}</h2>
      <Carousel
        slides={slides}
        renderSlide={(s) => <Card slide={s} />}
        keyExtractor={(s) => s.destination.id}
        options={{ slidesPerView, gap: 8 }}
        showDots={false}
        fallbackHeight={200}
        ariaLabel={t('label')}
      />
    </section>
  );
}

function Card({ slide }: { slide: Slide }) {
  const { destination, emoji, tone, regionLabel } = slide;
  return (
    <Link
      href={{ pathname: `/destination/${destination.id}` }}
      prefetch={false}
      className={`${styles.card} ${styles[tone]}`}
      aria-label={`${destination.name} · ${regionLabel}`}
    >
      <div className={styles.image} aria-hidden>
        <span className={styles.emoji}>{emoji}</span>
      </div>
      <div className={styles.body}>
        <p className={styles.region}>{regionLabel}</p>
        <h3 className={styles.name}>{destination.name}</h3>
      </div>
    </Link>
  );
}
