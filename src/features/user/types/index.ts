import type { UserDto } from '@/api/generated/schemas';

/**
 * User — orval 가 BE swagger 로 생성한 UserDto 의 alias.
 *
 * 마이그 점진성을 위해 type alias 유지 — 호출처는 `User` 그대로 사용,
 * 진실의 원천은 generated `UserDto` (필드 변경 시 자동 반영).
 *
 * homeRegion 은 generated 에서 `string` — RegionCode 가 필요한 곳은 `isRegionCode`
 * 가드 후 사용 (`src/constants/regions.ts`).
 */
export type User = UserDto;
