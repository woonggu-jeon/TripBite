/**
 * 시군 콘텐츠 도메인.
 *
 * 모든 type 은 generated DTO 직접 사용 (`@/api/generated/schemas`) — alias indirection 제거.
 * 본 파일은 UI 한정 narrowing 만 남김.
 */
import type { DestinationCategory } from '@/api/generated/schemas';

/** UI 탭에 쓰이는 type — generated 와 동일 (local 제거 이후 narrowing 무용해짐). */
export type RegionContentType = DestinationCategory;
