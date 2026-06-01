'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Carousel } from '@/features/carousel';
import { Skeleton } from '@/components/feedback/Skeleton';
import { useOngoingFestivals } from '@/features/region';
import { CHUNGBUK_REGIONS, type RegionCode } from '@/constants/regions';
import type { RegionContent } from '@/features/region/types';
import styles from './FestivalCarousel.module.scss';

/**
 * 지금 열리는 충북 축제 — 카드형 가로 스와이퍼.
 *
 * 데이터: `useOngoingFestivals()` → MSW handler `/regions/ongoing-festivals`.
 *
 * emoji / tone 은 시군 코드 기준 deterministic 매핑 — 디자인 시안 확정 시
 * BE 응답에 포함시키거나 별도 매핑 테이블 분리.
 *
 * 분기: isLoading → Skeleton row / 빈 응답 → null (홈 다른 위젯이 채움).
 */

type CarouselSlide = {
  content: RegionContent;
  emoji: string;
  tone: 'red' | 'amber' | 'green' | 'blue' | 'violet';
  regionLabel: string;
};

// 시군 → 톤 매핑 (디자인 시안 시 별 PR).
const REGION_TONE: Record<RegionCode, CarouselSlide['tone']> = {
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

// destination id 기반 emoji — 보은 대추 / 단양 마늘 / 괴산 고추 등 기존 라벨 유지.
const ID_EMOJI: Record<string, string> = {
  'boeun-festival-1': '🌰',
  'danyang-festival-1': '🧄',
  'goesan-festival-1': '🌶️',
  'cheongju-festival-1': '🎨',
  'jecheon-festival-1': '🎬',
};

function emojiFor(content: RegionContent): string {
  return ID_EMOJI[content.id] ?? '🎉';
}

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

export function FestivalCarousel() {
  const t = useTranslations('home.festivals');
  const slidesPerView = useResponsiveSlidesPerView();
  const { data, isLoading } = useOngoingFestivals();

  if (isLoading) {
    return <Skeleton width="100%" height={200} radius="lg" />;
  }
  if (!data || data.length === 0) {
    return null;
  }

  const slides: CarouselSlide[] = data.map((content) => ({
    content,
    emoji: emojiFor(content),
    tone: REGION_TONE[content.region] ?? 'amber',
    regionLabel: regionLabelFor(content.region),
  }));

  return (
    <Carousel
      slides={slides}
      renderSlide={(s) => <Card slide={s} />}
      keyExtractor={(s) => s.content.id}
      options={{ slidesPerView, gap: 8 }}
      showDots={false}
      fallbackHeight={200}
      ariaLabel={t('label')}
    />
  );
}

function Card({ slide }: { slide: CarouselSlide }) {
  const { content, emoji, tone, regionLabel } = slide;
  return (
    <Link
      href={{ pathname: `/destination/${content.id}` }}
      prefetch={false}
      className={`${styles.card} ${styles[tone]}`}
      aria-label={`${content.title} · ${regionLabel}`}
    >
      <div className={styles.image} aria-hidden>
        <span className={styles.emoji}>{emoji}</span>
      </div>
      <div className={styles.body}>
        <p className={styles.region}>{regionLabel}</p>
        <h3 className={styles.name}>{content.title}</h3>
        {(content.eventStart || content.eventEnd) && (
          <p className={styles.period}>
            {content.eventStart}
            {content.eventEnd ? ` — ${content.eventEnd}` : ''}
          </p>
        )}
      </div>
    </Link>
  );
}
