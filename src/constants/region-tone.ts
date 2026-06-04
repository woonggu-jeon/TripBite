import type { RegionCode } from './regions';
import type { DestinationCardTone } from '@/components/ui';

/**
 * 시군 → 카드 톤 매핑. 디자이너가 시군 색 조정 시 한 곳에서.
 *
 * 톤 값은 globals 의 --accent-{red|amber|green|blue|violet} 토큰을 가리킴.
 * DestinationCard 가 이 톤을 받아 image 그라데이션 + region 라벨 색을 결정.
 */
export const REGION_TONE: Record<RegionCode, DestinationCardTone> = {
  cheongju: 'violet',
  chungju: 'red',
  jecheon: 'blue',
  boeun: 'amber',
  okcheon: 'green',
  yeongdong: 'violet',
  jincheon: 'blue',
  goesan: 'red',
  eumseong: 'amber',
  danyang: 'green',
  jeungpyeong: 'blue',
};

export function toneFor(code: RegionCode): DestinationCardTone {
  return REGION_TONE[code] ?? 'amber';
}
