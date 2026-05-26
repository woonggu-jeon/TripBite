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

    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      setStatus('denied');
      return;
    }

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      console.error('NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set');
      setStatus('unsupported');
      return;
    }

    const subscription = await getOrCreatePushSubscription(vapidKey);
    if (!subscription) {
      setStatus('unsupported');
      return;
    }

    await notificationApi.subscribe(subscription);
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
