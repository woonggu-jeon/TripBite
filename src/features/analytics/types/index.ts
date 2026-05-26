/**
 * 추적 이벤트 — 도메인 기반 enum-like 타입
 *
 * 새 이벤트 추가 시 여기에 등록 → 호출부에서 typo 잡힘.
 * 데이터 분석팀과 합의된 이벤트 사전이 곧 이 파일이 됨.
 */
export type TrackEventMap = {
  'onboarding.started': void;
  'onboarding.location_allowed': void;
  'onboarding.location_skipped': void;
  'onboarding.completed': { nickname_length: number };
  'tournament.started': { theme: string; category: string; count: number };
  'tournament.completed': { winnerId: string; category: string; duration_ms: number };
  'tournament.saved': { winnerId: string };
  'letter.sent': { length: number };
  'letter.liked': { letterId: string };
  'letter.saved': { letterId: string };
  'quiz.started': void;
  'quiz.completed': { typeCode: string };
  'quiz.shared': { typeCode: string };
  'region.viewed': { regionCode: string; tab: string };
  'page.viewed': { pathname: string };
  'app.installed': void;
  'app.updated': { fromVersion: string; toVersion: string };
};

export type TrackEventName = keyof TrackEventMap;

export type AnalyticsProvider = {
  name: string;
  init?: () => void | Promise<void>;
  pageView?: (pathname: string) => void;
  track: <K extends TrackEventName>(event: K, payload?: TrackEventMap[K]) => void;
  identify?: (userId: string) => void;
  reset?: () => void;
};
