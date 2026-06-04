'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Carousel } from '@/features/carousel';
import { Skeleton } from '@/components/feedback/Skeleton';
import { DestinationCard } from '@/components/ui';
import { useRelatedDestinations } from '@/features/tournament/hooks/use-tournament';
import { CHUNGBUK_REGIONS, type RegionCode } from '@/constants/regions';
import { toneFor } from '@/constants/region-tone';
import styles from './RelatedDestinations.module.scss';

/**
 * 이 시군의 다른 여행지 — 메인의 "지금 열리는 충북 축제" 와 동일한 카드 + Carousel UI.
 *
 * 카드는 `DestinationCard` primitive (`ui/DestinationCard`) — FestivalCarousel /
 * SavedTournamentCard tile 과 같은 디자인. 톤은 시군 코드 → REGION_TONE.
 */

const CATEGORY_EMOJI: Record<string, string> = {
  attraction: '📍',
  festival: '🎪',
  experience: '🎨',
  local: '🏘️',
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

  return (
    <section className={styles.wrap} aria-label={t('label')}>
      <h2 className={styles.title}>{t('label')}</h2>
      <Carousel
        slides={data}
        renderSlide={(d) => (
          <DestinationCard
            href={{ pathname: `/destination/${d.id}` }}
            emoji={CATEGORY_EMOJI[d.category] ?? '📍'}
            tone={toneFor(d.region as RegionCode)}
            regionLabel={regionLabelFor(d.region as RegionCode)}
            name={d.name}
            ariaLabel={`${d.name} · ${regionLabelFor(d.region as RegionCode)}`}
          />
        )}
        keyExtractor={(d) => d.id}
        options={{ slidesPerView, gap: 8 }}
        showDots={false}
        fallbackHeight={200}
        ariaLabel={t('label')}
      />
    </section>
  );
}
