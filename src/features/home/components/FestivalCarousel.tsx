'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Carousel } from '@/features/carousel';
import { Skeleton } from '@/components/feedback/Skeleton';
import { DestinationCard } from '@/components/ui';
import { useOngoingFestivals } from '@/features/region';
import { CHUNGBUK_REGIONS, type RegionCode } from '@/constants/regions';
import { toneFor } from '@/constants/region-tone';
import type { RegionContent } from '@/features/region/types';

/**
 * 지금 열리는 충북 축제 — 카드형 가로 스와이퍼.
 *
 * 카드는 `DestinationCard` primitive 재사용 (RelatedDestinations / SavedTournamentCard
 * tile 과 동일 디자인). 축제는 `caption` 으로 기간 표시.
 *
 * 데이터: `useOngoingFestivals()` → MSW handler `/regions/ongoing-festivals`.
 *
 * 분기: isLoading → Skeleton row / 빈 응답 → null (홈 다른 위젯이 채움).
 */

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

function periodCaption(content: RegionContent): string | undefined {
  if (!content.eventStart && !content.eventEnd) return undefined;
  return `${content.eventStart ?? ''}${content.eventEnd ? ` — ${content.eventEnd}` : ''}`;
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

  return (
    <Carousel
      slides={data}
      renderSlide={(content) => (
        <DestinationCard
          href={{ pathname: `/destination/${content.id}` }}
          emoji={emojiFor(content)}
          tone={toneFor(content.region)}
          regionLabel={regionLabelFor(content.region)}
          name={content.title}
          caption={periodCaption(content)}
          ariaLabel={`${content.title} · ${regionLabelFor(content.region)}`}
        />
      )}
      keyExtractor={(s) => s.id}
      options={{ slidesPerView, gap: 8 }}
      showDots={false}
      fallbackHeight={200}
      ariaLabel={t('label')}
    />
  );
}
