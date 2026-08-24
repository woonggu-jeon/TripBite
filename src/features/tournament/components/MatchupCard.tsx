'use client';

import { Icon } from '@/components/icon';
import { HeroCard } from '@/components/ui';
import { CHUNGBUK_REGIONS } from '@/constants/regions';
import { categoryEmoji } from '@/constants/emoji-map';
import type { DestinationDto } from '@/types/api-domain';

export interface MatchupCardProps {
  destination: DestinationDto;
  onPick: () => void;
  disabled?: boolean;
}

/**
 * 1:1 매치업 카드 — Figma `visualCard` (320x176 사진 hero).
 *
 * 시안은 매치 선택지도 홈·랭킹과 같은 `hero` 컴포넌트를 쓴다: 풀블리드 사진 +
 * 좌→우 검정 scrim + 하단 좌측 흰 텍스트(이름 20 Bold / 핀+시군 12). 그래서
 * 여기서는 `HeroCard` 를 그대로 재사용한다 (구 구현은 정사각 썸네일 + 중앙
 * 정렬 텍스트의 흰 카드였다).
 *
 * 시안 hero-text 의 세 번째 줄(여행지 한 줄 소개)은 `DestinationDto` 에 대응
 * 필드가 없어 생략한다.
 *
 * disabled 는 현재 사용처가 없지만 API 는 유지 (Bracket 이 전달 가능).
 */
export function MatchupCard({
  destination,
  onPick,
  disabled,
}: MatchupCardProps) {
  const region = CHUNGBUK_REGIONS.find((r) => r.code === destination.region);
  const regionLabel = region?.ko ?? destination.region;

  return (
    <HeroCard
      onClick={disabled ? undefined : onPick}
      imageUrl={destination.imageUrl}
      emoji={categoryEmoji(destination.category)}
      title={destination.name}
      meta={regionLabel}
      metaIcon={<Icon name="location-12" size={12} />}
      titleAs="h3"
      align="bottom"
      sizes="(max-width: 720px) 100vw, 720px"
      // "{이름} 선택" — 선택지 버튼이라 동작을 읽어주는 기존 라벨 유지.
      // (시군은 카드에 보이는 텍스트라 라벨에 중복하지 않는다)
      ariaLabel={`${destination.name} 선택`}
    />
  );
}
