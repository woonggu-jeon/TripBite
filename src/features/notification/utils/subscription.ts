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

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
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
