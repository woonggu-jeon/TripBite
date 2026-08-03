'use client';

import { useTranslations } from 'next-intl';
import { Carousel } from '@/features/carousel';
import { Skeleton } from '@/components/feedback/Skeleton';
import { DestinationCard, PageSection } from '@/components/ui';
import { useOngoingFestivals } from '@/features/region';
import {
  CHUNGBUK_REGIONS,
  isRegionCode,
  type RegionCode,
} from '@/constants/regions';
import { toneFor } from '@/constants/region-tone';
import { useResponsiveSlidesPerView } from '@/hooks/use-responsive-slides-per-view';
import type {
  OngoingFestivalItemDto,
  OngoingFestivalsDto,
} from '@/api/generated/schemas';
import { DdayBadge } from './DdayBadge';
import styles from './FestivalCarousel.module.scss';

/**
 * 충북 축제 / 인기 여행지 캐러셀 — 3단계 폴백 표시 (BE 가 결정).
 *
 * 응답 type:
 *   - ongoing  진행 중 축제 (오늘 ≤ eventEndDate). 섹션 타이틀 "지금 열리는 축제"
 *   - upcoming 30일 이내 시작. 섹션 타이틀 "곧 열리는 축제" + 카드 좌상단 D-day 뱃지
 *   - popular  fallback. 섹션 타이틀 "이번 주 인기 여행지"
 *
 * D-day 는 BE 서버 KST 기준 daysToStart 필드. FE 클라 시계 의존 X.
 *
 * 빈 응답 (3단계 모두 0건) — section 자체 미노출.
 */

const ID_EMOJI: Record<string, string> = {
  'boeun-festival-1': '🌰',
  'danyang-festival-1': '🧄',
  'goesan-festival-1': '🌶️',
  'cheongju-festival-1': '🎨',
  'jecheon-festival-1': '🎬',
};

const TITLE_KEY: Record<OngoingFestivalsDto['type'], string> = {
  ongoing: 'festival.ongoing',
  upcoming: 'festival.upcoming',
  popular: 'festival.popular',
};

function emojiFor(item: OngoingFestivalItemDto): string {
  return ID_EMOJI[item.id] ?? '🎉';
}

function regionCodeOf(label: string | undefined): RegionCode {
  // BE 가 regionLabel 을 한글 (예: '청주') 로 보내는 케이스 + region code 케이스 둘 다 안전.
  if (!label) return 'cheongju';
  if (isRegionCode(label)) return label;
  const matched = CHUNGBUK_REGIONS.find(
    (r) => r.ko === label || r.en === label,
  );
  return matched?.code ?? 'cheongju';
}

/**
 * 카드에 노출할 시군명 — 항상 한글.
 * BE/목이 regionLabel 을 코드('cheongju') 로 보내는 케이스가 있어 그대로 쓰면
 * 카드에 영문 코드가 노출됐다. 코드는 한글명으로 변환한다.
 */
function regionLabelOf(item: OngoingFestivalItemDto): string {
  const code = regionCodeOf(item.regionLabel);
  const ko = CHUNGBUK_REGIONS.find((r) => r.code === code)?.ko;
  if (ko) return ko;
  return item.regionLabel ?? '';
}

export function FestivalCarousel() {
  const t = useTranslations('home');
  const slidesPerView = useResponsiveSlidesPerView();
  const { data, isLoading, isError } = useOngoingFestivals();

  // 빈 응답 / 에러 — section 자체 안 그림 (헤더만 남는 빈 영역 회피).
  if (isError || (!isLoading && (!data || data.items.length === 0))) {
    return null;
  }

  const sectionTitle = data ? t(TITLE_KEY[data.type]) : t('festival.ongoing');
  const showDday = data?.type === 'upcoming';

  return (
    <PageSection
      title={sectionTitle}
      className={styles.section}
      data-widget="ongoing-festivals"
      data-type={data?.type}
    >
      {isLoading || !data ? (
        <Skeleton width="100%" height={200} radius="lg" />
      ) : (
        <Carousel
          slides={data.items}
          renderSlide={(item) => (
            <DestinationCard
              href={{ pathname: `/destination/${item.id}` }}
              imageUrl={item.imageUrl}
              emoji={emojiFor(item)}
              tone={toneFor(regionCodeOf(item.regionLabel))}
              regionLabel={regionLabelOf(item)}
              name={item.name}
              ariaLabel={`${item.name} · ${regionLabelOf(item)}`}
              topLeftBadge={
                showDday && typeof item.daysToStart === 'number' ? (
                  <DdayBadge daysToStart={item.daysToStart} />
                ) : undefined
              }
            />
          )}
          keyExtractor={(s) => s.id}
          options={{ slidesPerView, gap: 8 }}
          showDots={false}
          fallbackHeight={200}
          ariaLabel={sectionTitle}
        />
      )}
    </PageSection>
  );
}
