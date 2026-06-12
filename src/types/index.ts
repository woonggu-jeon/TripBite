// 전역에서 자주 쓰는 도메인 타입 re-export
import type { UserDto } from '@/api/generated/schemas';

/**
 * User — orval generated `UserDto` alias.
 * homeRegion 은 generated 에서 `string` — RegionCode 가 필요한 곳은
 * `isRegionCode` 가드 후 사용 (`src/constants/regions.ts`).
 */
export type User = UserDto;

export type { Toast } from '@/stores/ui-store';

export type {
  Destination,
  DestinationCategory,
  Season,
  TournamentTheme,
  TournamentConfig,
  TournamentCount,
  SavedTournament,
} from '@/features/tournament/types';

export type { RankedDestination, RankingType } from '@/features/ranking/types';

// API 공통 응답 envelope (백엔드 컨벤션에 맞춰 조정)
export type ApiResponse<T> = {
  data: T;
  message?: string;
};

export type ApiError = {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
};
