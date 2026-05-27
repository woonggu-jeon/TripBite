/**
 * MSW REST 핸들러 — dev + vitest + playwright 공유
 *
 * 동작:
 *   dev:    src/mocks/browser.ts 의 setupWorker 가 service worker 로 가로챔
 *   vitest: src/mocks/server.ts 의 setupServer 가 node 환경에서 가로챔
 *   e2e:    playwright globalSetup 에서 동일 server 사용 가능
 *
 * 활성화 토글 (dev):
 *   .env.local 에 NEXT_PUBLIC_USE_MSW=true 추가
 *   providers.tsx 가 동적 import 로 worker.start() 호출
 *
 * 주의:
 *   service worker 는 same-origin scope 만 가로챔.
 *   백엔드 호출이 cross-origin (`NEXT_PUBLIC_API_URL`이 다른 호스트) 이면
 *   axios baseURL 을 same-origin proxy 로 두거나, Next rewrites 로 우회 필요.
 *   테스트 (vitest/node) 에선 origin 제약 없이 모두 가로챔.
 */

import { http, HttpResponse } from 'msw';
import { regionContentSeeds } from './seeds/regions';
import { letterSeeds } from './seeds/letters';
import { tournamentHistorySeeds } from './seeds/tournament';
import { notificationSeeds } from './seeds/notifications';

/**
 * URL 매칭 base.
 * MSW 모드에서 axios baseURL이 '/api/backend'로 바뀌므로 (services/api/client.ts)
 * handler URL도 same-origin path prefix를 사용해야 매칭됨.
 * MSW 미사용 시(예: 테스트 외 production)는 NEXT_PUBLIC_API_URL 그대로.
 */
const apiUrl =
  process.env.NEXT_PUBLIC_USE_MSW === 'true'
    ? '/api/backend'
    : (process.env.NEXT_PUBLIC_API_URL ?? '');

export const mockSeeds = {
  regions: regionContentSeeds,
  letters: letterSeeds,
  tournaments: tournamentHistorySeeds,
  notifications: notificationSeeds,
  apiUrl,
};

const mockUser = {
  id: '1',
  nickname: '테스터',
  email: 't@e.com',
  homeRegion: 'cheongju',
} as const;

/**
 * 온보딩 완료 상태 — 신규 가입 흐름 재현용 mutable 상태.
 *   - 초기 false → /me가 isOnboarded:false → AuthBootstrap이 /onboarding 유지
 *   - complete-onboarding 호출 시 true → 이후 /me가 true → 홈 진입
 * dev 서버(서비스워커) 재시작 시 false로 리셋.
 */
let onboardedState = false;

const mockResolvedLocation = {
  latitude: 36.6424,
  longitude: 127.489,
  label: '충북 청주시',
  regionCode: 'cheongju',
};

const mockWeather = {
  temperature: 18,
  feelsLike: 17,
  condition: 'clear' as const,
  summary: '맑음, 외출하기 좋아요',
  humidity: 55,
  locationLabel: '충북 청주시',
};

export const handlers = [
  // ===== Auth =====
  http.post(`${apiUrl}/auth/login`, () => HttpResponse.json({ success: true })),
  http.post(
    `${apiUrl}/auth/logout`,
    () => new HttpResponse(null, { status: 204 }),
  ),
  http.post(
    `${apiUrl}/auth/refresh`,
    () => new HttpResponse(null, { status: 204 }),
  ),
  http.get(`${apiUrl}/me`, () =>
    HttpResponse.json({ ...mockUser, isOnboarded: onboardedState }),
  ),

  // ===== Onboarding =====
  http.post(`${apiUrl}/me/complete-onboarding`, async ({ request }) => {
    const body = (await request.json()) as { nickname?: string };
    onboardedState = true;
    return HttpResponse.json({
      ...mockUser,
      nickname: body.nickname ?? mockUser.nickname,
      isOnboarded: true,
    });
  }),

  // ===== Location =====
  // 좌표 → 라벨 (reverse geocode)
  http.post(`${apiUrl}/location/reverse`, async ({ request }) => {
    const coords = (await request.json()) as {
      latitude: number;
      longitude: number;
    };
    return HttpResponse.json({
      ...coords,
      label: mockResolvedLocation.label,
      regionCode: mockResolvedLocation.regionCode,
    });
  }),
  // IP 기반 대략적 위치
  http.get(`${apiUrl}/location/ip`, () =>
    HttpResponse.json(mockResolvedLocation),
  ),

  // ===== Weather =====
  http.get(`${apiUrl}/weather/current`, () => HttpResponse.json(mockWeather)),

  // ===== Letters =====
  http.post(`${apiUrl}/letters`, () => new HttpResponse(null, { status: 201 })),
  http.get(`${apiUrl}/letters/received`, ({ request }) => {
    const url = new URL(request.url);
    const cursor = Number(url.searchParams.get('cursor') ?? 0);
    const limit = Number(url.searchParams.get('limit') ?? 10);
    const slice = letterSeeds.slice(cursor, cursor + limit);
    const nextCursor =
      cursor + limit < letterSeeds.length ? cursor + limit : null;
    return HttpResponse.json({ items: slice, nextCursor });
  }),
  http.get(`${apiUrl}/letters/sent`, () =>
    HttpResponse.json({ items: letterSeeds.slice(0, 5), nextCursor: null }),
  ),
  http.get(`${apiUrl}/letters/liked`, () =>
    HttpResponse.json({
      items: letterSeeds.filter((l) => l.liked),
      nextCursor: null,
    }),
  ),
  http.get(`${apiUrl}/letters/saved`, () =>
    HttpResponse.json({
      items: letterSeeds.filter((l) => l.saved),
      nextCursor: null,
    }),
  ),
  http.get(`${apiUrl}/letters/:id`, ({ params }) => {
    const seed = letterSeeds.find((l) => l.id === params.id);
    if (!seed) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(seed);
  }),

  // ===== Region =====
  http.get(`${apiUrl}/regions/:code/contents`, ({ params, request }) => {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const items = regionContentSeeds.filter(
      (r) => r.region === params.code && r.type === type,
    );
    return HttpResponse.json({ items, nextCursor: null });
  }),

  // ===== Tournament =====
  http.get(`${apiUrl}/mypage/tournament-history`, () =>
    HttpResponse.json({ items: tournamentHistorySeeds, nextCursor: null }),
  ),

  // ===== Notifications =====
  http.get(`${apiUrl}/notifications`, () =>
    HttpResponse.json({
      items: notificationSeeds,
      unreadCount: notificationSeeds.filter((n) => !n.read).length,
    }),
  ),
];
