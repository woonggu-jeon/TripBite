/**
 * 토너먼트 도메인 타입 — orval generated enum / DTO alias.
 *
 * BE swagger 가 Season / DestinationCategory enum 명시 → generated 가 자동 union.
 * FE 는 그대로 re-export — 진실의 원천은 swagger.
 */
import type {
  DestinationCategory as DestinationCategoryDto,
  Season as SeasonDto,
} from '@/api/generated/schemas';

export type Season = SeasonDto;
export type DestinationCategory = DestinationCategoryDto;

/**
 * 토너먼트 테마 — 항상 계절 기반.
 *
 * UI 진입 흐름은 2 가지:
 *   - season(직접 선택): 사용자가 계절 4 중 하나 직접 선택
 *   - random        : 계절 + 카테고리 자동 랜덤 — 흐름만 다르고 저장값은 동일
 *     (이 경우에도 kind='season' 으로 통일, value 에 랜덤 선택된 계절 저장).
 *
 * 백엔드 호환 위해 kind 는 'season' 단일로 유지 (special 분기는 폐기).
 */
export type TournamentTheme = { kind: 'season'; value: Season };

/**
 * 갯수 옵션 — 여행지 갯수(N) 와 토너먼트 매치업 사이즈(M) 는 다른 옵션 셋.
 *   - 여행지 갯수 (Setup count): 2 | 4 | 6 | 8 (지도 꽃잎 수)
 *   - 토너먼트 사이즈 (Play tournamentSize): 4 | 8 | 16 | 32 (매치업 트리)
 *
 * 둘은 독립 — 매치업 destinations 은 풀에서 random M 개 pick (시군 dedup 없이).
 * 사용자가 4강 선택하면 4명 토너먼트, 32강 선택하면 32명 토너먼트가 생성.
 */
export type TournamentCount = 2 | 4 | 6 | 8 | 16 | 32;

export const DESTINATION_COUNT_OPTIONS: readonly TournamentCount[] = [
  2, 4, 6, 8,
] as const;

export const TOURNAMENT_SIZE_OPTIONS: readonly TournamentCount[] = [
  4, 8, 16, 32,
] as const;

export type TournamentConfig = {
  theme: TournamentTheme;
  categories: DestinationCategory[]; // 최소 1개
  region?: string; // 충북 시군 (예: "청주시") — 단일 시군 한정 시
  /** 여행지 갯수 (N) — 지도에 떨어질 꽃잎(시군) 수. Setup 에서 결정. */
  count: TournamentCount;
  /**
   * map phase 에서 결정된 N 시군 코드 (예: ['cheongju','boeun']).
   * BE 의 `/destinations/random?regions=...` query 로 전달 → BE 는 이 시군들 안에서만
   * destinations 추출. Setup 직후엔 undefined, map phase 의 random pick 후 set.
   */
  selectedRegions?: string[];
  /**
   * 토너먼트 매치업 사이즈 (M). Play 페이지의 tournamentSize phase 에서 결정.
   * 결정되면 store.setTournamentSize 로 갱신되며 백엔드 API 호출 파라미터로 함께 전달.
   * 초기(Setup 직후) 단계에선 undefined.
   */
  tournamentSize?: TournamentCount;
};

/**
 * Destination / DestinationDetail — orval generated DTO alias.
 * BE swagger 가 enum + 모든 응답 필드 명시 → generated 가 진실의 원천.
 */
import type {
  DestinationDetailDto,
  DestinationDto,
} from '@/api/generated/schemas';

export type Destination = DestinationDto;
export type DestinationDetail = DestinationDetailDto;

export type BracketMatch = {
  round: number; // 1=결승, 2=준결승, ...
  matchId: string;
  a: Destination;
  b: Destination;
  winnerId?: string;
};

/**
 * Bracket 종료 시 onComplete 로 전달되는 결과 메타.
 *
 * - winner: 우승 여행지
 * - runnerUp: 결승 상대 (참가 1명일 땐 null)
 * - matchesPlayed: 결정된 매치 수 (= participants - 1)
 */
export type BracketResult = {
  winner: Destination;
  runnerUp: Destination | null;
  matchesPlayed: number;
};

// SavedTournament / TournamentRecord — orval generated DTO alias.
import type {
  SavedTournamentDto,
  TournamentRecordDto,
} from '@/api/generated/schemas';

export type SavedTournament = SavedTournamentDto;
export type TournamentRecord = TournamentRecordDto;
