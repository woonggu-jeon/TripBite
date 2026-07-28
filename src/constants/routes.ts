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
 * 하단 네비게이션 5탭
 *
 * 사이트맵 기준 5탭 — Figma nav (홈/랭킹/토너먼트/편지/마이) 순서 고정.
 * (raised 강조 원은 Figma 정렬로 폐기 — 전 탭 플랫)
 */
export const BOTTOM_NAV_ROUTES = [
  { path: ROUTES.HOME, labelKey: 'home', icon: 'nav-home' },
  { path: ROUTES.RANKING, labelKey: 'ranking', icon: 'nav-rank' },
  { path: ROUTES.TOURNAMENT, labelKey: 'tournament', icon: 'nav-trophy' },
  { path: ROUTES.LETTER, labelKey: 'letter', icon: 'nav-letter' },
  { path: ROUTES.MYPAGE, labelKey: 'mypage', icon: 'nav-my' },
] as const;
