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
 * 갯수 옵션 — 여행지 갯수(N) / 토너먼트 매치업 사이즈(M) 둘 다 같은 옵션 풀에서 선택.
 * 제약: M ≤ N (매치업 사이즈는 여행지 갯수 이하)
 */
export type TournamentCount = 2 | 4 | 6 | 8;

export type TournamentConfig = {
  theme: TournamentTheme;
  categories: DestinationCategory[]; // 최소 1개
  region?: string; // 충북 시군 (예: "청주시") — 단일 시군 한정 시
  /** 여행지 갯수 (N) — 지도에 떨어질 꽃잎(시군) 수. 백엔드 호출 파라미터. */
  count: TournamentCount;
  /** 토너먼트 매치업 사이즈 (M ≤ N) — N 중 random M 개로 토너먼트 진행. */
  tournamentSize: TournamentCount;
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

export type SavedTournament = {
  id: string;
  destination: Destination;
  luckyColor: string; // hex
  meetChance: number; // 0~100
  savedAt: string; // ISO
};
