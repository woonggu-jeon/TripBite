'use client';

import { useCallback, useState } from 'react';
import {
  getOrCreatePushSubscription,
  isPushSupported,
  requestNotificationPermission,
  unsubscribePush,
} from '@/features/notification/utils/subscription';
import { notificationApi } from '@/features/notification/api/notification';

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

    // 3) VAPID public key 있을 때만 실제 push subscribe.
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      // 키 미설정 — 권한만 받고 종료 (mock/dev 흐름). 운영에선 키 필수.
      setStatus('enabled');
      return;
    }

    const subscription = await getOrCreatePushSubscription(vapidKey);
    if (!subscription) {
      setStatus('enabled');
      return;
    }

    // 4) 백엔드에 subscription 등록 — 실패해도 권한은 잡혀있으니 enabled 유지.
    try {
      await notificationApi.subscribe(subscription);
    } catch {
      // mock 환경 외 실패는 silent — 사용자가 알림 자체는 받을 수 있음.
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
