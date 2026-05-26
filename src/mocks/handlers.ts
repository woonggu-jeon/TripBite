/**
 * MSW REST 핸들러 — dev + vitest + playwright 공유
 *
 * msw 설치 후 활성화:
 *   npm i -D msw
 *
 * 사용:
 *   dev:    src/mocks/browser.ts 의 setupWorker 가 service worker 로 가로챔
 *   vitest: src/mocks/server.ts 의 setupServer 가 node 환경에서 가로챔
 *   e2e:    playwright globalSetup 에서 동일 server 사용 가능
 *
 * 백엔드 API 가 준비되면 환경변수로 토글:
 *   if (process.env.NEXT_PUBLIC_USE_MSW === 'true') worker.start();
 */

// import { http, HttpResponse } from 'msw';   // msw 설치 후 주석 해제
import { regionContentSeeds } from './seeds/regions';
import { letterSeeds } from './seeds/letters';
import { tournamentHistorySeeds } from './seeds/tournament';
import { notificationSeeds } from './seeds/notifications';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';

// msw 설치 전 임시 — 아래는 msw 도입 후 활성화될 예시 핸들러
// 실제 작성 시 import 라인 주석 해제하고 export const handlers = [ ... ] 로 변경

export const mockSeeds = {
  regions: regionContentSeeds,
  letters: letterSeeds,
  tournaments: tournamentHistorySeeds,
  notifications: notificationSeeds,
  apiUrl,
};

/**
 * msw 도입 후 핸들러 예시:
 *
 * export const handlers = [
 *   // /me
 *   http.get(`${apiUrl}/me`, () =>
 *     HttpResponse.json({
 *       id: '1', nickname: '테스터', email: 't@e.com', isOnboarded: true,
 *     }),
 *   ),
 *
 *   // 편지함 페이지네이션
 *   http.get(`${apiUrl}/letters/received`, ({ request }) => {
 *     const url = new URL(request.url);
 *     const cursor = Number(url.searchParams.get('cursor') ?? 0);
 *     const limit = Number(url.searchParams.get('limit') ?? 10);
 *     const slice = letterSeeds.slice(cursor, cursor + limit);
 *     const nextCursor = cursor + limit < letterSeeds.length ? cursor + limit : null;
 *     return HttpResponse.json({ items: slice, nextCursor });
 *   }),
 *
 *   // 시군 콘텐츠
 *   http.get(`${apiUrl}/regions/:code/contents`, ({ params, request }) => {
 *     const url = new URL(request.url);
 *     const type = url.searchParams.get('type');
 *     const items = regionContentSeeds
 *       .filter((r) => r.region === params.code && r.type === type);
 *     return HttpResponse.json({ items, nextCursor: null });
 *   }),
 *
 *   // 토너먼트 기록
 *   http.get(`${apiUrl}/mypage/tournament-history`, () =>
 *     HttpResponse.json({ items: tournamentHistorySeeds, nextCursor: null }),
 *   ),
 *
 *   // 알림 inbox
 *   http.get(`${apiUrl}/notifications`, () =>
 *     HttpResponse.json({
 *       items: notificationSeeds,
 *       unreadCount: notificationSeeds.filter((n) => !n.read).length,
 *     }),
 *   ),
 * ];
 */
