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

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';

export const mockSeeds = {
  regions: regionContentSeeds,
  letters: letterSeeds,
  tournaments: tournamentHistorySeeds,
  notifications: notificationSeeds,
  apiUrl,
};

export const handlers = [
  // /me
  http.get(`${apiUrl}/me`, () =>
    HttpResponse.json({
      id: '1',
      nickname: '테스터',
      email: 't@e.com',
      isOnboarded: true,
    }),
  ),

  // 편지함 페이지네이션 — received
  http.get(`${apiUrl}/letters/received`, ({ request }) => {
    const url = new URL(request.url);
    const cursor = Number(url.searchParams.get('cursor') ?? 0);
    const limit = Number(url.searchParams.get('limit') ?? 10);
    const slice = letterSeeds.slice(cursor, cursor + limit);
    const nextCursor =
      cursor + limit < letterSeeds.length ? cursor + limit : null;
    return HttpResponse.json({ items: slice, nextCursor });
  }),

  // 시군 콘텐츠
  http.get(`${apiUrl}/regions/:code/contents`, ({ params, request }) => {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const items = regionContentSeeds.filter(
      (r) => r.region === params.code && r.type === type,
    );
    return HttpResponse.json({ items, nextCursor: null });
  }),

  // 토너먼트 기록
  http.get(`${apiUrl}/mypage/tournament-history`, () =>
    HttpResponse.json({ items: tournamentHistorySeeds, nextCursor: null }),
  ),

  // 알림 inbox
  http.get(`${apiUrl}/notifications`, () =>
    HttpResponse.json({
      items: notificationSeeds,
      unreadCount: notificationSeeds.filter((n) => !n.read).length,
    }),
  ),
];
