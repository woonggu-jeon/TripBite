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
 * Figma nav 는 5탭이 모두 동일한 평면 탭 (72x60, 아이콘 24, gap 4).
 * 이전에 토너먼트에 있던 `emphasized: true` (가운데 돌출 버튼) 는 시안에 없어 제거됨.
 */
export const BOTTOM_NAV_ROUTES = [
  { path: ROUTES.HOME, labelKey: 'home', icon: 'home' },
  // Figma navIcon `name=rank` 는 불꽃(flame) — 상승 화살표가 아니다
  { path: ROUTES.RANKING, labelKey: 'ranking', icon: 'flame' },
  { path: ROUTES.TOURNAMENT, labelKey: 'tournament', icon: 'trophy' },
  { path: ROUTES.LETTER, labelKey: 'letter', icon: 'mail' },
  { path: ROUTES.MYPAGE, labelKey: 'mypage', icon: 'user' },
] as const;
