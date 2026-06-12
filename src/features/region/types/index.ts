/**
 * 시군 콘텐츠 도메인 — orval generated DTO alias.
 *
 * BE swagger 가 `RegionContentDto.type` 을 `DestinationCategory` enum 으로 명시.
 * UI 의 탭은 3종 (`attraction | festival | experience`) — `local` 은 region content
 * 도메인엔 안 쓰임. FE 측 RegionContentType 만 좁힘 (UI 탭 props 등).
 */
import type {
  DestinationCategory,
  OngoingFestivalItemDto,
  OngoingFestivalsDto,
  RegionContentDto,
  RegionSummaryDto,
} from '@/api/generated/schemas';

/** UI 탭에 쓰이는 type 좁힘. */
export type RegionContentType = Exclude<DestinationCategory, 'local'>;

export type RegionContent = RegionContentDto;
export type RegionSummary = RegionSummaryDto;

/**
 * 홈 캐러셀 — 3단계 폴백 응답 (BE 가 단일 endpoint 안에서 결정).
 *   - 'ongoing'  진행 중 축제 (eventStart ≤ today ≤ eventEnd)
 *   - 'upcoming' 다가오는 축제 30일 이내 — daysToStart 표시
 *   - 'popular'  fallback. 이번 주 인기 여행지
 */
export type OngoingFestivals = OngoingFestivalsDto;
export type OngoingFestivalItem = OngoingFestivalItemDto;
