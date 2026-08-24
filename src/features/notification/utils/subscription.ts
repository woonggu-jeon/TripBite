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
import { createLogger } from '@/lib/logger';
import { safeInternalPath } from '@/lib/safe-redirect';

const log = createLogger('push');

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
 * mock 환경 — dev 도구로 새 편지 도착 알림을 시뮬레이션.
 *
 * 구현: main thread `new Notification(...)` 만 사용 (dev 단순화).
 *   - SW 의 MOCK_PUSH message 경로는 옛 캐시된 SW 가 handler 없을 때 silent
 *     fail 하는 회귀가 있어 제외.
 *   - 실 운영의 서버 push (web-push 발송) 는 sw.ts 의 `push` event handler 가
 *     별도 경로로 처리 — mock 도구와 분리.
 *   - 페이지가 열려있을 때만 OS 토스트 (background 알림 X) — dev 검증엔 충분.
 *
 * 권한 / 미지원 시 콘솔에 명확한 사유 로그 — 디버깅 친화.
 */
export async function triggerMockPush(payload: {
  title?: string;
  body?: string;
  link?: string;
  tag?: string;
  icon?: string;
}): Promise<void> {
  if (typeof Notification === 'undefined') {
    log.warn('Notification API 미지원 환경');
    return;
  }
  if (Notification.permission !== 'granted') {
    log.warn({ permission: Notification.permission }, '권한 미허용');
    return;
  }
  try {
    const n = new Notification(payload.title ?? '편지가 도착했어요', {
      body: payload.body,
      icon: payload.icon ?? '/icons/icon-192x192.png',
      tag: payload.tag,
    });
    if (payload.link) {
      // open-redirect / javascript: 스킴 차단 — internal path 만 허용.
      // mock 도구라 입력 source 가 dev 콘솔이지만 실제 push 와 동일 가드 적용
      // (defense in depth, login/onboarding 과 동일한 safeInternalPath 규칙).
      const safeLink = safeInternalPath(payload.link);
      n.onclick = () => {
        window.focus();
        window.location.href = safeLink;
        n.close();
      };
    }
    log.info({ title: payload.title }, 'notification dispatched');
  } catch (err) {
    log.error({ err }, 'notification 생성 실패');
  }
}
