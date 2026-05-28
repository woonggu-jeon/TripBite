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
 * 토너먼트에 참가할 시군 수 (전체=11).
 * 백엔드 API 는 이 값을 받아 충북 11개 시군 중 N 개를 random 선택해 destinations 반환.
 * UI 상 라벨: 4/8/10 곳 또는 "전체".
 */
export type TournamentCount = 4 | 8 | 10 | 11;

export type TournamentConfig = {
  theme: TournamentTheme;
  categories: DestinationCategory[]; // 최소 1개
  region?: string; // 충북 시군 (예: "청주시") — 단일 시군 한정 시
  count: TournamentCount; // 시군 수 — 백엔드 호출 파라미터
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
