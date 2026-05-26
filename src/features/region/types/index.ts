import type { RegionCode } from '@/constants/regions';

/**
 * TourAPI 기반 시군 콘텐츠
 *
 * 백엔드가 한국관광공사 TourAPI 를 프록시 + 캐싱하는 것을 권장 (API 키 + 호출량 관리).
 * 백엔드 응답은 다음 정도로 단순화하는 것이 좋음.
 */
export type RegionContentType = 'attraction' | 'festival' | 'experience';

export type RegionContent = {
  id: string;
  /** TourAPI contentId */
  contentId: string;
  type: RegionContentType;
  region: RegionCode;
  title: string;
  /** 짧은 한 줄 소개 */
  summary?: string;
  /** TourAPI firstimage / firstimage2 */
  imageUrl?: string;
  /** TourAPI mapx / mapy */
  lat?: number;
  lng?: number;
  /** 축제 전용: 시작/종료일 */
  eventStart?: string;
  eventEnd?: string;
};

export type RegionSummary = {
  code: RegionCode;
  heroImage?: string;
  description?: string;
  /** 인기도 점수 (서버 계산) */
  popularity?: number;
};
