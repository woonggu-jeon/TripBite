'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/feedback/Skeleton';
import { DestinationCard } from '@/components/ui/DestinationCard';
import { Carousel } from '@/features/carousel';
import { useResponsiveSlidesPerView } from '@/hooks/use-responsive-slides-per-view';
import { useRecommendedDestinations } from '@/features/ranking/hooks/use-ranking';
import { CHUNGBUK_REGIONS, type RegionCode } from '@/constants/regions';
import { toneFor } from '@/constants/region-tone';
import { categoryEmoji } from '@/constants/emoji-map';
import type {
  DestinationCategory,
  DestinationDto,
} from '@/api/generated/schemas';
import styles from './HomeRecBlock.module.scss';

/**
 * 홈 추천 블록 — Figma "HOME · 홈 · rec-block" (2026-06-23).
 *
 * 구성:
 *   - mid (sec-title + subtitle): title B_16 fg "추천 여행지" + Caption R_12
 *     muted "취향에 맞는 곳을 골라봤어요" (또는 "더 보기" 우측 link 미사용).
 *   - chips: 전체 (primary fill, Bold) + 3 카테고리 (outline gray, R_14 muted)
 *     — festival / attraction / experience.
 *   - section: DestinationCard 3 horizontal scroll (saved-grid 408w x-scroll).
 *
 * 데이터: useRecommendedDestinations(8) — TanStack Query cache 공유. HomeHero
 * 가 [0] 사용 — RecBlock 은 [1..] 만 노출하여 hero 와 중복 회피.
 * chip 변경 시 client filter (refetch X).
 */
type ChipKey = 'all' | DestinationCategory;

const CHIPS: ChipKey[] = ['all', 'festival', 'attraction', 'experience'];

export function HomeRecBlock() {
  const t = useTranslations('home.recBlock');
  const [activeChip, setActiveChip] = useState<ChipKey>('all');
  const { data, isLoading } = useRecommendedDestinations(8);
  const slidesPerView = useResponsiveSlidesPerView();

  if (isLoading) {
    return (
      <section className={styles.wrap}>
        <Skeleton width="100%" height={28} radius="sm" />
        <Skeleton width="100%" height={168} radius="md" />
      </section>
    );
  }

  const rest = (data ?? []).slice(1).map((r) => r.destination);
  if (rest.length === 0) return null;

  const filtered: DestinationDto[] =
    activeChip === 'all' ? rest : rest.filter((d) => d.category === activeChip);

  return (
    <section className={styles.wrap} aria-label={t('title')}>
      <div className={styles.mid}>
        <div className={styles.midText}>
          <h2 className={styles.midTitle}>{t('title')}</h2>
          <p className={styles.midSubtitle}>{t('subtitle')}</p>
        </div>
        {/* 더보기 + chevron — /ranking 으로 이동 (사용자 명시 2026-06-24).
            Figma "rec-block mid" 우측: Caption R_12 muted "더보기" + chevron 12. */}
        <Link
          href="/ranking"
          className={styles.moreLink}
          aria-label={t('moreLabel')}
        >
          <span className={styles.moreText}>{t('moreText')}</span>
          <ChevronRight size={12} aria-hidden />
        </Link>
      </div>

      <ul className={styles.chips} role="tablist" aria-label={t('filterLabel')}>
        {CHIPS.map((chip) => {
          const isActive = chip === activeChip;
          return (
            <li key={chip}>
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveChip(chip)}
                className={`${styles.chip} ${isActive ? styles.chipOn : styles.chipOff}`}
              >
                {t(`chip.${chip}`)}
              </button>
            </li>
          );
        })}
      </ul>

      {filtered.length > 0 ? (
        <Carousel
          slides={filtered}
          renderSlide={(d) => {
            const region = CHUNGBUK_REGIONS.find((r) => r.code === d.region);
            const regionLabel = region?.ko ?? d.region;
            return (
              <DestinationCard
                href={{ pathname: `/destination/${d.id}` }}
                imageUrl={d.imageUrl}
                emoji={categoryEmoji(d.category)}
                tone={toneFor(d.region as RegionCode)}
                regionLabel={regionLabel}
                name={d.name}
              />
            );
          }}
          keyExtractor={(d) => d.id}
          options={{ slidesPerView, gap: 8 }}
          showDots={false}
          ariaLabel={t('title')}
          fallbackHeight={168}
        />
      ) : (
        <p className={styles.empty}>{t('emptyForChip')}</p>
      )}
    </section>
  );
}
