'use client';

import { useTranslations } from 'next-intl';
import { memo } from 'react';
import { HeroCard } from '@/components/ui';
import { categoryEmoji } from '@/constants/emoji-map';
import { CHUNGBUK_REGIONS } from '@/constants/regions';
import type { DestinationDto } from '@/types/api-domain';

/**
 * 토너먼트 우승 hero — Figma "TRN · 토너먼트 결과" hero (320×176).
 *
 * 공용 `HeroCard` 프리미티브 재사용(풀블리드 사진 + scrim + 흰 텍스트 오버레이).
 * 이전엔 자체 마크업/스타일을 뒀는데 SCSS 가 구 원형썸네일 디자인으로 stale 되어
 * hero 가 깨졌음 → HeroCard 로 통일(홈/랭킹 hero 와 동일 렌더 보장).
 *   - eyebrow  : "우승 여행지"
 *   - title    : destination.name
 *   - meta     : "{region} · {category}"
 *   - align    : bottom (우승 텍스트 하단 정렬)
 */
function WinnerCardInner({ destination }: { destination: DestinationDto }) {
  const t = useTranslations('tournament');
  const tResult = useTranslations('tournament.result');
  const region = CHUNGBUK_REGIONS.find((r) => r.code === destination.region);
  const regionLabel = region?.ko ?? destination.region;
  const categoryLabel = t(`category.${destination.category}`);
  const eyebrow = tResult('winnerEyebrow');

  return (
    <HeroCard
      imageUrl={destination.imageUrl}
      emoji={categoryEmoji(destination.category)}
      eyebrow={eyebrow}
      title={destination.name}
      titleAs="h2"
      meta={`${regionLabel} · ${categoryLabel}`}
      align="bottom"
      sizes="(max-width: 720px) 100vw, 720px"
      ariaLabel={`${eyebrow} ${destination.name}`}
    />
  );
}

// React.memo — TournamentResultClient store/query 변경 시 불필요한 재렌더 회피.
export const WinnerCard = memo(WinnerCardInner);
