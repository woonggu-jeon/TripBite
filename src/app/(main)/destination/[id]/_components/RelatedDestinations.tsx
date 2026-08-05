'use client';

import { useTranslations } from 'next-intl';
import { Carousel } from '@/features/carousel';
import { Skeleton } from '@/components/feedback/Skeleton';
import { DestinationCard } from '@/components/ui';
import { useRelatedDestinations } from '@/features/tournament/hooks/use-tournament';
import { CHUNGBUK_REGIONS, type RegionCode } from '@/constants/regions';
import { categoryEmoji } from '@/constants/emoji-map';
import { useResponsiveSlidesPerView } from '@/hooks/use-responsive-slides-per-view';
import styles from './RelatedDestinations.module.scss';

/**
 * 이 시군의 다른 여행지 — 메인의 "지금 열리는 충북 축제" 와 동일한 카드 + Carousel UI.
 *
 * 카드는 `DestinationCard` primitive (`ui/DestinationCard`) — FestivalCarousel /
 * SavedTournamentCard tile 과 같은 디자인.
 */
function regionLabelFor(code: RegionCode): string {
  return CHUNGBUK_REGIONS.find((r) => r.code === code)?.ko ?? code;
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
        <Skeleton width="100%" height={189} radius="lg" />
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
            imageUrl={d.imageUrl}
            emoji={categoryEmoji(d.category)}
            regionLabel={regionLabelFor(d.region as RegionCode)}
            name={d.name}
            ariaLabel={`${d.name} · ${regionLabelFor(d.region as RegionCode)}`}
          />
        )}
        keyExtractor={(d) => d.id}
        options={{ slidesPerView, gap: 8 }}
        showDots={false}
        fallbackHeight={189}
        ariaLabel={t('label')}
      />
    </section>
  );
}
