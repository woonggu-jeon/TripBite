'use client';

import { useTranslations } from 'next-intl';
import { Carousel } from '@/features/carousel';
import { Skeleton } from '@/components/feedback/Skeleton';
import { DestinationCard } from '@/components/ui';
import { useOngoingFestivals } from '@/features/region';
import {
  CHUNGBUK_REGIONS,
  isRegionCode,
  type RegionCode,
} from '@/constants/regions';
import { toneFor } from '@/constants/region-tone';
import { useResponsiveSlidesPerView } from '@/hooks/use-responsive-slides-per-view';
import type { Festival } from '@/features/region/types';
import styles from './FestivalCarousel.module.scss';

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

function emojiFor(content: Festival): string {
  return ID_EMOJI[content.id] ?? '🎉';
}

// generated 의 Festival.region 이 string — RegionCode 가드 후 fallback.
function regionCodeOf(region: string): RegionCode {
  return isRegionCode(region) ? region : 'cheongju';
}

function regionLabelFor(region: string): string {
  const code = regionCodeOf(region);
  return CHUNGBUK_REGIONS.find((r) => r.code === code)?.ko ?? region;
}

function periodCaption(content: Festival): string | undefined {
  if (!content.eventStart && !content.eventEnd) return undefined;
  return `${content.eventStart ?? ''}${content.eventEnd ? ` — ${content.eventEnd}` : ''}`;
}

/**
 * 섹션 wrapper (section + h2) 도 자체 책임 — 빈 응답 시 영역 자체 미노출.
 * 부모 (HomeDashboard) 는 `<FestivalCarousel />` 한 줄만 쓰면 됨.
 */
export function FestivalCarousel() {
  const t = useTranslations('home');
  const slidesPerView = useResponsiveSlidesPerView();
  const { data, isLoading, isError } = useOngoingFestivals();

  // 빈 응답 / 에러 — section 자체 안 그림 (헤더만 남는 빈 영역 회피).
  if (isError || (!isLoading && (!data || data.length === 0))) {
    return null;
  }

  return (
    <section
      data-widget="ongoing-festivals"
      aria-label={t('widgets.ongoingFestivals')}
    >
      <h2 className={styles.title}>{t('widgets.ongoingFestivals')}</h2>
      {isLoading ? (
        <Skeleton width="100%" height={200} radius="lg" />
      ) : (
        <Carousel
          slides={data ?? []}
          renderSlide={(content) => (
            <DestinationCard
              href={{ pathname: `/destination/${content.id}` }}
              imageUrl={content.imageUrl}
              emoji={emojiFor(content)}
              tone={toneFor(regionCodeOf(content.region))}
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
          ariaLabel={t('festivals.label')}
        />
      )}
    </section>
  );
}
