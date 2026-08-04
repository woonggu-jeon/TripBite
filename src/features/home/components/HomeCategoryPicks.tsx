'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ChevronRight } from 'lucide-react';
import { Carousel } from '@/features/carousel';
import { Skeleton } from '@/components/feedback/Skeleton';
import { DestinationCard, PageSection, TabList, Tab } from '@/components/ui';
import { useRecommendedDestinations } from '@/features/ranking/hooks/use-ranking';
import { useOngoingFestivals } from '@/features/region';
import {
  CHUNGBUK_REGIONS,
  isRegionCode,
  type RegionCode,
} from '@/constants/regions';
import { toneFor } from '@/constants/region-tone';
import { categoryEmoji } from '@/constants/emoji-map';
import { useResponsiveSlidesPerView } from '@/hooks/use-responsive-slides-per-view';
import { ROUTES } from '@/constants/routes';
import type {
  DestinationCategory,
  OngoingFestivalItemDto,
} from '@/api/generated/schemas';
import { DdayBadge } from './DdayBadge';
import styles from './HomeCategoryPicks.module.scss';

/**
 * 홈 카테고리 추천 — Figma `HOME · 홈` 의 `rec-block`.
 *
 *   섹션 헤더 : 제목 16 Bold + 보조 12 + 우측 "더보기 >"
 *   `chips`   : 전체 / 관광지 / 축제 / 체험관광 (pill 32px, H gap 4)
 *   `section` : DestinationCard 152x168 가로 스크롤
 *
 * 데이터 두 곳을 합친다:
 *   - `/rankings?type=recommended` — 전 카테고리 추천
 *   - `/regions/festivals/ongoing` — 진행/임박 축제 (D-day 뱃지 유지)
 *
 * 축제 전용 엔드포인트를 함께 쓰는 이유: 추천 목록만으로는 "축제" 칩이 빌 수
 * 있고, D-day 정보(daysToStart)는 축제 응답에만 있다. 구 FestivalCarousel 이
 * 담당했던 D-day 표시를 이 섹션이 그대로 흡수했다.
 *
 * 카테고리 필터는 클라이언트에서 한다 — generated ranking client 가 category
 * 쿼리를 넘기지 않는다 (rankingApi.list 주석 참고). 서버 필터가 열리면 교체.
 */
type CategoryFilter = 'all' | DestinationCategory;

const FILTERS: CategoryFilter[] = [
  'all',
  'attraction',
  'festival',
  'experience',
];

/** 두 응답을 카드 렌더에 필요한 최소 모델로 정규화. */
type PickItem = {
  id: string;
  name: string;
  category: DestinationCategory;
  regionCode: RegionCode;
  regionLabel: string;
  imageUrl?: string | null;
  /** 축제만 — 있으면 좌상단 D-day 뱃지 */
  daysToStart?: number;
};

function regionCodeOf(label: string | undefined): RegionCode {
  // BE 가 regionLabel 을 한글('청주') 로도, code('cheongju') 로도 보낸다.
  if (!label) return 'cheongju';
  if (isRegionCode(label)) return label;
  return (
    CHUNGBUK_REGIONS.find((r) => r.ko === label || r.en === label)?.code ??
    'cheongju'
  );
}

function koLabelOf(code: RegionCode): string {
  return CHUNGBUK_REGIONS.find((r) => r.code === code)?.ko ?? code;
}

function fromFestival(item: OngoingFestivalItemDto): PickItem {
  const code = regionCodeOf(item.regionLabel);
  return {
    id: item.id,
    name: item.name,
    category: 'festival',
    regionCode: code,
    regionLabel: koLabelOf(code),
    imageUrl: item.imageUrl,
    daysToStart:
      typeof item.daysToStart === 'number' ? item.daysToStart : undefined,
  };
}

export function HomeCategoryPicks() {
  const t = useTranslations('home.picks');
  const tCommon = useTranslations('common');
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const slidesPerView = useResponsiveSlidesPerView();

  const recommended = useRecommendedDestinations(24);
  const festivals = useOngoingFestivals();

  const isLoading = recommended.isLoading || festivals.isLoading;

  const items: PickItem[] = useMemo(() => {
    const fest = (festivals.data?.items ?? []).map(fromFestival);
    const rest = (recommended.data ?? []).map((r) => {
      const code = regionCodeOf(r.destination.region);
      return {
        id: r.destination.id,
        name: r.destination.name,
        category: r.destination.category,
        regionCode: code,
        regionLabel: koLabelOf(code),
        imageUrl: r.destination.imageUrl,
      } satisfies PickItem;
    });
    // 축제를 앞에 — 기간이 있는 항목이라 시간 민감도가 높다. id 중복 제거.
    const seen = new Set<string>();
    return [...fest, ...rest].filter((it) => {
      if (seen.has(it.id)) return false;
      seen.add(it.id);
      return true;
    });
  }, [festivals.data, recommended.data]);

  const visible = useMemo(
    () =>
      filter === 'all' ? items : items.filter((i) => i.category === filter),
    [items, filter],
  );

  // 두 요청 모두 실패/빈 응답 — 섹션 자체 미노출 (헤더만 남는 빈 영역 회피).
  if (!isLoading && items.length === 0) return null;

  return (
    <PageSection
      data-widget="category-picks"
      className={styles.section}
      title={t('title')}
      hint={t('hint')}
      action={
        <Link href={ROUTES.REGION}>
          {tCommon('showMore')}
          <ChevronRight size={16} aria-hidden />
        </Link>
      }
    >
      {/* Figma `chips` — pill 32px, H gap 4 */}
      <TabList ariaLabel={t('categoryAria')} className={styles.chips}>
        {FILTERS.map((f) => (
          <Tab
            key={f}
            id={`home-picks-${f}`}
            selected={filter === f}
            onSelect={() => setFilter(f)}
            className={`${styles.chip} ${filter === f ? styles.chipActive : ''}`}
          >
            {t(`categories.${f}`)}
          </Tab>
        ))}
      </TabList>

      {isLoading ? (
        <Skeleton width="100%" height={168} radius="md" />
      ) : visible.length === 0 ? (
        <p className={styles.empty}>{t('empty')}</p>
      ) : (
        <div className={styles.carousel}>
          <Carousel
            slides={visible}
            renderSlide={(item) => (
              <DestinationCard
                href={{ pathname: `/destination/${item.id}` }}
                imageUrl={item.imageUrl}
                emoji={categoryEmoji(item.category, '✨')}
                tone={toneFor(item.regionCode)}
                regionLabel={item.regionLabel}
                name={item.name}
                ariaLabel={`${item.name} · ${item.regionLabel}`}
                topLeftBadge={
                  item.daysToStart != null ? (
                    <DdayBadge daysToStart={item.daysToStart} />
                  ) : undefined
                }
              />
            )}
            keyExtractor={(s) => s.id}
            options={{ slidesPerView, gap: 8 }}
            showDots={false}
            fallbackHeight={168}
            ariaLabel={t('hint')}
          />
        </div>
      )}
    </PageSection>
  );
}
