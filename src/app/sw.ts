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
});

// PwaUpdateBanner → SKIP_WAITING (use-service-worker-update.ts 연동)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    void self.skipWaiting();
  }
});

serwist.addEventListeners();
