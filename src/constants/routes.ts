/**
 * 앱 전체 라우트 (사이트맵 v2)
 *
 * 그룹:
 *   (auth)     — 로그인 + 온보딩 (헤더/네비 없음)
 *   (main)     — 인증+온보딩 완료 후 접근. 헤더+컨텐츠+네비.
 */
export const ROUTES = {
  // Auth & setup
  LOGIN: '/login',
  ONBOARDING: '/onboarding',

  // Main
  HOME: '/',
  RANKING: '/ranking',
  TOURNAMENT: '/tournament',
  TOURNAMENT_PLAY: '/tournament/play',
  TOURNAMENT_RESULT: '/tournament/result',
  LETTER: '/letter',
  LETTER_COMPOSE: '/letter/compose',
  LETTER_DETAIL: (id: string) => `/letter/${id}`,
  MYPAGE: '/mypage',

  // Main - 신규
  REGION: '/region',
  REGION_DETAIL: (code: string) => `/region/${code}`,
  // 여행지 상세 — 시군 콘텐츠 row / 토너먼트 우승지 등에서 진입.
  // mock /destinations/:id 가 destinationSeeds + regionContentSeeds 모두 탐색.
  DESTINATION_DETAIL: (id: string) => `/destination/${id}`,
  QUIZ: '/quiz',
  SETTINGS: '/settings',
  NOTIFICATIONS: '/notifications',
} as const;

/**
 * 하단 네비게이션 5탭 — Figma "nav" 정합 (2026-06-23). 5탭 평등 (72×62
 * stroke + Caption M_10/B_10). 이전 emphasized (raised circle) — 자체
 * 디자인이었으나 Figma 정합 결정으로 제거.
 */
export const BOTTOM_NAV_ROUTES = [
  { path: ROUTES.HOME, labelKey: 'home', icon: 'home' },
  { path: ROUTES.RANKING, labelKey: 'ranking', icon: 'trending-up' },
  { path: ROUTES.TOURNAMENT, labelKey: 'tournament', icon: 'trophy' },
  { path: ROUTES.LETTER, labelKey: 'letter', icon: 'mail' },
  { path: ROUTES.MYPAGE, labelKey: 'mypage', icon: 'user' },
] as const;
