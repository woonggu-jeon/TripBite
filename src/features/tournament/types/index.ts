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

export type DestinationCategory = 'festival' | 'attraction' | 'experience';

export type TournamentCount = 4 | 8 | 16 | 32;

export type TournamentConfig = {
  theme: TournamentTheme;
  categories: DestinationCategory[]; // 최소 1개
  region?: string;                   // 충북 시군 (예: "청주시")
  count: TournamentCount;
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
  round: number;          // 1=결승, 2=준결승, ...
  matchId: string;
  a: Destination;
  b: Destination;
  winnerId?: string;
};

export type SavedTournament = {
  id: string;
  destination: Destination;
  luckyColor: string;     // hex
  meetChance: number;     // 0~100
  savedAt: string;        // ISO
};
