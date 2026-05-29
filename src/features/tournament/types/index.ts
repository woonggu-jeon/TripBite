/**
 * 토너먼트 도메인 타입
 *
 * 백엔드 OpenAPI 스펙 확정 후엔 @/generated/api 에서 import 권장.
 */

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type SpecialDay = 'birthday' | 'anniversary';

export type TournamentTheme =
  | { kind: 'season'; value: Season }
  | { kind: 'special'; value: SpecialDay };

export type DestinationCategory =
  | 'local' // 지역 — 시군 대표/일반 명소
  | 'festival' // 축제
  | 'attraction' // 관광지
  | 'experience'; // 체험관광

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
   * 토너먼트 매치업 사이즈 (M ≤ N). Play 페이지의 tournamentSize phase 에서 결정.
   * 결정되면 store.setTournamentSize 로 갱신되며 백엔드 API 호출 파라미터로 함께 전달.
   * 초기(Setup 직후) 단계에선 undefined.
   */
  tournamentSize?: TournamentCount;
};

export type Destination = {
  id: string;
  name: string;
  category: DestinationCategory;
  region: string;
  imageUrl?: string;
  description?: string;
  // 기타 메타: 운영시간, 주소, 좌표 등
};

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

export type SavedTournament = {
  id: string;
  destination: Destination;
  luckyColor: string; // hex
  meetChance: number; // 0~100
  savedAt: string; // ISO
};
