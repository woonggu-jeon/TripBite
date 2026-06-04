/// <reference lib="webworker" />
import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import {
  Serwist,
  CacheFirst,
  StaleWhileRevalidate,
  ExpirationPlugin,
  CacheableResponsePlugin,
} from 'serwist';

/**
 * Serwist Service Worker (next-pwa 대체)
 *
 * 캐시 전략:
 *   - 외부 도메인(jsdelivr 폰트, TourAPI 이미지) + /icons.svg → 커스텀 명시
 *   - Next 내부(RSC/navigation/_next/static/기타 이미지) → defaultCache 위임
 *
 * 업데이트 흐름:
 *   skipWaiting:false — 새 SW는 대기. PwaUpdateBanner가 SKIP_WAITING 메시지 →
 *   아래 message 리스너가 self.skipWaiting() → controllerchange → reload.
 *   (use-service-worker-update.ts와 연동)
 *
 * API 응답은 캐시하지 않음 (사용자별 데이터 누설 방지) — runtimeCaching에 API 패턴 없음.
 */

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const YEAR = 60 * 60 * 24 * 365;
const MONTH = 60 * 60 * 24 * 30;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      // jsdelivr Pretendard 폰트 — CacheFirst 1년
      matcher: /^https:\/\/cdn\.jsdelivr\.net\/.+\.(?:woff2?|css)$/i,
      handler: new CacheFirst({
        cacheName: 'pretendard-fonts',
        plugins: [
          new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: YEAR }),
          new CacheableResponsePlugin({ statuses: [0, 200] }),
        ],
      }),
    },
    {
      // SVG sprite — CacheFirst 1년
      matcher: /\/icons\.svg$/i,
      handler: new CacheFirst({
        cacheName: 'icon-sprite',
        plugins: [new ExpirationPlugin({ maxEntries: 1, maxAgeSeconds: YEAR })],
      }),
    },
    {
      // TourAPI 이미지 — CacheFirst 30일
      matcher:
        /^https:\/\/tong\.visitkorea\.or\.kr\/.+\.(?:jpe?g|png|webp|avif)$/i,
      handler: new CacheFirst({
        cacheName: 'tour-api-images',
        plugins: [
          new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: MONTH }),
        ],
      }),
    },
    {
      // 기타 이미지 — StaleWhileRevalidate 7일
      matcher: /\.(?:jpe?g|png|webp|avif|svg|gif)$/i,
      handler: new StaleWhileRevalidate({
        cacheName: 'static-images',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 7,
          }),
        ],
      }),
    },
    // Next 내부(RSC/navigation/_next/static 등) 기본 캐시
    ...defaultCache,
  ],
  // 오프라인 fallback — 문서 요청 실패 시 /offline 페이지로.
  // /offline 은 정적 페이지로 precache 됨 (next-build → __SW_MANIFEST 에 포함).
  fallbacks: {
    entries: [
      {
        url: '/offline',
        matcher: ({ request }) => request.destination === 'document',
      },
    ],
  },
});

// PwaUpdateBanner → SKIP_WAITING (use-service-worker-update.ts 연동)
// MOCK_PUSH — mock 환경에서 클라이언트가 push 이벤트를 시뮬레이션할 때 사용.
//   실 서버 push 인프라(VAPID + web-push 라이브러리) 없이도 dev 에서 알림 흐름을
//   끝까지 테스트할 수 있도록 — 클라이언트가 postMessage 로 trigger →
//   SW 가 showNotification 직접 호출.
self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') {
    void self.skipWaiting();
    return;
  }
  if (event.data.type === 'MOCK_PUSH') {
    const p = event.data.payload ?? {};
    event.waitUntil(
      self.registration.showNotification(p.title ?? '편지가 도착했어요', {
        body: p.body,
        icon: p.icon ?? '/icons/icon-192x192.png',
        badge: p.badge ?? '/icons/icon-72x72.png',
        tag: p.tag, // 같은 tag → OS 가 중복 알림 합침
        data: { link: p.link },
      }),
    );
  }
});

/**
 * Web Push — 실 서버가 web-push 로 보낸 푸시 이벤트.
 * payload (JSON): { title, body, link, tag, icon, badge }
 * 본 핸들러는 mock 시뮬레이션 (MOCK_PUSH) 과 동일 표시 로직.
 */
self.addEventListener('push', (event) => {
  let payload: {
    title?: string;
    body?: string;
    link?: string;
    tag?: string;
    icon?: string;
    badge?: string;
  } = {};
  try {
    payload = event.data?.json() ?? {};
  } catch {
    // 서버가 raw text 로 보낸 경우 — 최소 fallback
    payload = { title: event.data?.text() || '새 알림' };
  }
  event.waitUntil(
    self.registration.showNotification(payload.title ?? '편지가 도착했어요', {
      body: payload.body,
      icon: payload.icon ?? '/icons/icon-192x192.png',
      badge: payload.badge ?? '/icons/icon-72x72.png',
      tag: payload.tag,
      data: { link: payload.link },
    }),
  );
});

/**
 * 알림 클릭 — 이미 열린 우리 origin 탭이 있으면 focus + 메시지로 navigate.
 * 없으면 link 로 새 창 open.
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = (event.notification.data?.link as string | undefined) ?? '/';
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      const own = all.filter(
        (c) => new URL(c.url).origin === self.location.origin,
      );
      const first = own[0];
      if (first) {
        await first.focus();
        first.postMessage({ type: 'NAVIGATE', link });
        return;
      }
      await self.clients.openWindow(link);
    })(),
  );
});

serwist.addEventListeners();
