/**
 * 아키텍처 문서 19번
 *
 * Web Push 구독 처리 유틸.
 * - VAPID public key를 Uint8Array로 변환
 * - Service Worker 등록 + Push Manager 구독
 *
 * 사전 조건:
 * - HTTPS (또는 localhost)
 * - manifest.json
 * - service worker 등록됨 (next-pwa가 자동 처리)
 * - 백엔드 /notifications/subscribe API
 */

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function isPushSupported(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  return Notification.requestPermission();
}

export async function getOrCreatePushSubscription(
  vapidPublicKey: string,
): Promise<PushSubscription | null> {
  if (!(await isPushSupported())) return null;

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
  }

  return subscription;
}

export async function unsubscribePush(): Promise<boolean> {
  if (!(await isPushSupported())) return false;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return true;
  return subscription.unsubscribe();
}

/**
 * iOS Safari Web Push 는 PWA standalone 모드에서만 동작 (iOS 16.4+).
 * 일반 Safari 탭에서 enable 시도는 silent fail. UX 상 미리 안내 필요.
 */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  // iOS legacy + 표준 둘 다 검사
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    nav.standalone === true ||
    window.matchMedia?.('(display-mode: standalone)').matches === true
  );
}

export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  // iPadOS 13+ 의 desktop UA 모드도 포함 (touch + Mac)
  const ua = window.navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

/**
 * iOS 에서 push 사용 가능 여부 — Safari + standalone 모드 + iOS 16.4+ 의 조건.
 * `isPushSupported()` 가 true 라도 iOS 일반 탭이면 권한 요청은 silent fail.
 */
export function canUsePushOnIOS(): boolean {
  return !isIOS() || isStandalone();
}

/**
 * mock 환경 — Service Worker 에 MOCK_PUSH 메시지 보내 push 이벤트를 시뮬레이션.
 * 실 서버의 VAPID + web-push 없이도 dev 에서 알림 끝까지 테스트.
 *
 * SW 가 없는 환경 (Serwist dev 비활성 등) 에서는 main thread Notification API
 * 로 fallback. 페이지가 열려있을 때만 동작 (background 알림 X) 하지만 dev 흐름
 * 검증엔 충분.
 */
export async function triggerMockPush(payload: {
  title?: string;
  body?: string;
  link?: string;
  tag?: string;
  icon?: string;
}): Promise<void> {
  if (typeof navigator === 'undefined') return;

  // 1) Service Worker 경로 — registration 있고 active 일 때.
  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker
      .getRegistration()
      .catch(() => null);
    if (reg?.active) {
      reg.active.postMessage({ type: 'MOCK_PUSH', payload });
      return;
    }
  }

  // 2) Fallback — main thread Notification API. dev (Serwist 비활성) 보강.
  if (
    typeof Notification !== 'undefined' &&
    Notification.permission === 'granted'
  ) {
    const n = new Notification(payload.title ?? '편지가 도착했어요', {
      body: payload.body,
      icon: payload.icon ?? '/icons/icon-192x192.png',
      tag: payload.tag,
    });
    if (payload.link) {
      n.onclick = () => {
        window.focus();
        window.location.href = payload.link!;
        n.close();
      };
    }
  }
}
