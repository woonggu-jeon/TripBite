'use client';

import { useCallback, useState } from 'react';
import { notificationApi } from '@/features/notification/api/notification';
import {
  getOrCreatePushSubscription,
  isPushSupported,
  requestNotificationPermission,
  unsubscribePush,
} from '@/features/notification/utils/subscription';

/**
 * 아키텍처 문서 19번 - Push Notification 구조
 *
 * 사용 예:
 *   const { enable, disable, status } = usePushNotification();
 *   <button onClick={enable}>알림 켜기</button>
 *
 * VAPID public key는 env로 주입:
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY
 */
export function usePushNotification() {
  const [status, setStatus] = useState<
    'idle' | 'requesting' | 'enabled' | 'disabled' | 'unsupported' | 'denied'
  >('idle');

  const enable = useCallback(async () => {
    setStatus('requesting');

    if (!(await isPushSupported())) {
      setStatus('unsupported');
      return;
    }

    // 1) 권한 요청 — 사용자 user-activation 안에서 호출되어야 함 (button onClick OK).
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      setStatus('denied');
      return;
    }

    // 2) Service Worker 활성화 여부 확인. Serwist 가 dev 에서 disable 인 경우
    //    SW registration 자체가 없을 수 있음 → push subscription 만들기 불가.
    //    이 경우 권한만 받고 enabled 처리 — triggerMockPush 가 main thread
    //    Notification API fallback 으로 알림 표시.
    const swReg =
      'serviceWorker' in navigator
        ? await navigator.serviceWorker.getRegistration().catch(() => null)
        : null;
    if (!swReg) {
      setStatus('enabled');
      return;
    }

    // 3) VAPID public key — BE(GET /notifications/vapid-public-key)에서 조회.
    //    실패/미설정 시 env(NEXT_PUBLIC_VAPID_PUBLIC_KEY) fallback(dev/mock).
    const vapidKey =
      (await notificationApi.getVapidKey().catch(() => null)) ??
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      // 키 미설정 — 권한만 받고 종료 (mock/dev 흐름). 운영에선 키 필수.
      setStatus('enabled');
      return;
    }

    // 4) 구독 생성 + 백엔드 등록 — 실패해도 권한은 잡혀있으니 enabled 유지.
    //    (invalid VAPID 키/푸시 서비스 부재 등으로 subscribe 가 throw 해도 enable 은
    //     resolve 되어야 함 — 호출부(토글)의 후속 상태 갱신을 막지 않도록.)
    try {
      const subscription = await getOrCreatePushSubscription(vapidKey);
      if (subscription) await notificationApi.subscribe(subscription);
    } catch {
      // silent — 사용자가 알림 자체(권한)는 받은 상태.
    }
    setStatus('enabled');
  }, []);

  const disable = useCallback(async () => {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await notificationApi.unsubscribe(subscription.endpoint);
      await unsubscribePush();
    }
    setStatus('disabled');
  }, []);

  return { enable, disable, status };
}
