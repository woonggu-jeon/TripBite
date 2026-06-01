// 전역에서 자주 쓰는 도메인 타입 re-export
export type { User } from '@/features/user/types';
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

export type { Letter, LetterAuthor } from '@/features/letter/types';

export type {
  RankedDestination,
  RankingType,
  TravelType,
} from '@/features/ranking/types';

export type {
  AppNotification,
  NotificationInbox,
  NotificationType,
} from '@/features/notification/types';

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
