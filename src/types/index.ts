// 전역에서 자주 쓰는 자체 도메인 타입.
// generated DTO (`UserDto` 등) 는 직접 `@/api/generated/schemas` 에서 import.

export type { Toast } from '@/stores/ui-store';

export type {
  TournamentTheme,
  TournamentConfig,
  TournamentCount,
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
