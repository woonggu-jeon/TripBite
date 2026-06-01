/**
 * 토너먼트 도메인 타입
 *
 * 백엔드 OpenAPI 스펙 확정 후엔 @/generated/api 에서 import 권장.
 */

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

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

/**
 * 여행지 상세 — 토너먼트 결과 화면 등에서 별도 fetch 로 받는 풍부한 메타.
 *
 * 모든 추가 필드는 optional — 백엔드 응답이 점진적으로 채워져도 (또는 누락되어도)
 * 컴포넌트가 깨지지 않도록. UI 는 있는 필드만 렌더 (분기/디폴트 X).
 *
 * API: GET /destinations/:id → DestinationDetail
 *
 * 이미지 / 평점 / 운영시간 / 주소 등은 백엔드가 외부 데이터 소스(공공 API,
 * 큐레이션 DB) 와 결합해 제공한다고 가정.
 */
export type DestinationDetail = Destination & {
  /** 한 줄 요약 (카드용) */
  summary?: string;
  /** 대표 이미지 URL 들 — 첫 항목이 헤로 */
  photos?: string[];
  address?: string;
  phone?: string;
  website?: string;
  /** 운영시간 — 줄바꿈 가능한 자유 문자열 (백엔드가 i18n/포맷 책임) */
  openingHours?: string;
  /** 입장료 / 가격 안내 */
  admissionFee?: string;
  /** 좌표 (지도 표시용) */
  coords?: { lat: number; lng: number };
  tags?: string[];
  rating?: {
    /** 0~5 평균 */
    value: number;
    count: number;
  };
  /** 추천 시즌 (Season 코드 배열) */
  bestSeasons?: Season[];
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
