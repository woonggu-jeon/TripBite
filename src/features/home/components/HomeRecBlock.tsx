'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/feedback/Skeleton';
import { DestinationCard } from '@/components/ui/DestinationCard';
import { Carousel } from '@/features/carousel';
import { useResponsiveSlidesPerView } from '@/hooks/use-responsive-slides-per-view';
import { useRecommendationGroups } from '@/features/home/hooks/use-recommendations';
import { CHUNGBUK_REGIONS, type RegionCode } from '@/constants/regions';
import { toneFor } from '@/constants/region-tone';
import { categoryEmoji } from '@/constants/emoji-map';
import type {
  DestinationCategory,
  DestinationDto,
} from '@/api/generated/schemas';
import styles from './HomeRecBlock.module.scss';

/**
 * 홈 추천 블록 — Figma "HOME · 홈 · rec-block".
 *
 * 데이터 (2026-06-24 BE 전환):
 *   - `GET /v1/destinations/recommendations` (신설) — festival/attraction/
 *     experience 3 그룹 응답.
 *   - chip 'all' → 3 그룹 합침, 'festival'/'attraction'/'experience' → 그룹
 *     그대로 노출. client filter (refetch X).
 *
 * 기존 `GET /rankings?type=recommended` (인기순, 관광지 only) 는 HomeHero
 * 가 그대로 사용 — BE retire 시점에 통합.
 */
type ChipKey = 'all' | DestinationCategory;

const CHIPS: ChipKey[] = ['all', 'festival', 'attraction', 'experience'];

export function HomeRecBlock() {
  const t = useTranslations('home.recBlock');
  const [activeChip, setActiveChip] = useState<ChipKey>('all');
  const { data, isLoading } = useRecommendationGroups();
  const slidesPerView = useResponsiveSlidesPerView();

  if (isLoading) {
    return (
      <section className={styles.wrap}>
        <Skeleton width="100%" height={28} radius="sm" />
        <Skeleton width="100%" height={168} radius="md" />
      </section>
    );
  }
  if (!data) return null;

  const filtered: DestinationDto[] =
    activeChip === 'all'
      ? [...data.festival, ...data.attraction, ...data.experience]
      : data[activeChip];

  // 3 그룹 모두 비면 섹션 자체 미노출 (이전 동작 유지).
  const totalCount =
    data.festival.length + data.attraction.length + data.experience.length;
  if (totalCount === 0) return null;

  return (
    <section className={styles.wrap} aria-label={t('title')}>
      <div className={styles.mid}>
        <div className={styles.midText}>
          <h2 className={styles.midTitle}>{t('title')}</h2>
          <p className={styles.midSubtitle}>{t('subtitle')}</p>
        </div>
        {/* 더보기 + chevron — /ranking 으로 이동.
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
