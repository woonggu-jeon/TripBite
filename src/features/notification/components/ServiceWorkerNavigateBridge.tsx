'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';

/**
 * Service Worker → 클라이언트 NAVIGATE 메시지 브리지.
 *
 * 흐름:
 *   1) 사용자가 알림(push / mock-push) 을 클릭
 *   2) sw.ts 의 `notificationclick` 핸들러가 이미 열린 우리 origin 탭이 있으면
 *      `clients.focus()` 후 `client.postMessage({ type: 'NAVIGATE', link })`
 *   3) 이 컴포넌트가 그 메시지를 받아 router.push 로 SPA 전환.
 *
 * 열린 탭이 없으면 sw 가 `clients.openWindow(link)` 로 새 창을 열기 때문에
 * 본 브리지는 불필요. (이 경로 / 새 창 모두 동일 link 로 진입)
 */
export function ServiceWorkerNavigateBridge() {
  const router = useRouter();
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator))
      return;
    const handler = (event: MessageEvent) => {
      const data = event.data;
      if (!data || data.type !== 'NAVIGATE') return;
      const link = data.link;
      if (typeof link !== 'string' || link.length === 0) return;
      // typedRoutes 의 정적 분석 외 (서버/SW 가 임의로 보낸 path) — cast.
      router.push(link as Parameters<typeof router.push>[0]);
    };
    navigator.serviceWorker.addEventListener('message', handler);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handler);
    };
  }, [router]);
  return null;
}
