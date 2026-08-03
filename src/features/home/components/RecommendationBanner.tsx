'use client';

import { useTranslations } from 'next-intl';
import { MapPin } from 'lucide-react';
import { Carousel } from '@/features/carousel';
import { Skeleton } from '@/components/feedback/Skeleton';
import { HeroCard } from '@/components/ui';
import { useRecommendedDestinations } from '@/features/ranking/hooks/use-ranking';
import { CHUNGBUK_REGIONS } from '@/constants/regions';
import { categoryEmoji } from '@/constants/emoji-map';
import type { DestinationDto } from '@/api/generated/schemas';
import styles from './RecommendationBanner.module.scss';

/**
 * 오늘의 추천 — `/v1/rankings?type=recommended&limit=5` 응답.
 *
 * BE 가 카테고리/지역/계절 가중치 산정 → top 5 destinations. FE 는 그대로 표시.
 * 빈 응답 / 에러 → 영역 미노출 (HomeDashboard 가 children render 결정 위해
 * 부모 wrapper 없이 통째 자체 책임).
 *
 * 레이아웃: Figma `HOME · 홈` 의 hero — 사진 풀블리드 + 좌→우 scrim + 흰 텍스트
 * 3단 (라벨 / 여행지명 / 핀+시군). 파스텔 면 + 정사각 썸네일 조합에서 교체됨.
 * 캐러셀(5개 자동 넘김)은 Figma 에 없는 기능이지만 유지 — 시안은 정지 상태의
 * 1번 슬라이드를 그린 것.
 */
function regionLabelFor(code: string): string {
  return CHUNGBUK_REGIONS.find((r) => r.code === code)?.ko ?? code;
}

export function RecommendationBanner() {
  const t = useTranslations('home.recommendation');
  const { data, isLoading, isError } = useRecommendedDestinations(5);

  if (isLoading) {
    // Figma hero 20/11 비율 — 720px cap 에서 396px, 실제 폭에 따라 줄어듦.
    return <Skeleton width="100%" aspectRatio="20 / 11" radius="md" />;
  }

  if (isError || !data || data.length === 0) {
    return null;
  }

  const items = data.map((r) => r.destination);

  return (
    <div className={styles.wrap}>
      <Carousel
        slides={items}
        renderSlide={(item) => <Slide item={item} eyebrow={t('label')} />}
        keyExtractor={(item) => item.id}
        options={{ loop: true, autoplayMs: 4500 }}
        showDots
        fallbackHeight={176}
        ariaLabel={t('label')}
      />
    </div>
  );
}

function Slide({ item, eyebrow }: { item: DestinationDto; eyebrow: string }) {
  const regionKo = regionLabelFor(item.region);
  return (
    <HeroCard
      href={{ pathname: `/destination/${item.id}` }}
      imageUrl={item.imageUrl}
      emoji={categoryEmoji(item.category, '✨')}
      eyebrow={eyebrow}
      title={item.name}
      meta={regionKo}
      metaIcon={<MapPin aria-hidden />}
      align="center"
      sizes="(max-width: 720px) 100vw, 720px"
      ariaLabel={`${item.name} · ${regionKo}`}
    />
  );
}
