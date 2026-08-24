import {
  deleteSubscription,
  getSubscriptions,
  getVapidPublicKey,
  subscribe,
  unsubscribe,
} from '@/api/be/notification/notification';
import type { PushSubscriptionDto } from '@/api/be/schemas';

function toPayload(subscription: PushSubscription) {
  const json = subscription.toJSON();
  return {
    endpoint: json.endpoint ?? subscription.endpoint,
    keys: {
      p256dh: json.keys?.p256dh ?? '',
      auth: json.keys?.auth ?? '',
    },
  };
}

/**
 * Web Push — 신규 Spring BE (`@/api/be/notification`) client wrap.
 *
 *   GET  /notifications/vapid-public-key      → VAPID 공개키(구독 생성용)
 *   POST /notifications/subscribe   {endpoint, keys:{p256dh, auth}}
 *   POST /notifications/unsubscribe {endpoint}
 *   GET  /notifications/subscriptions          → 등록된 기기 목록
 *   DELETE /notifications/subscriptions/{id}   → 특정 기기 구독 해제
 */
export const notificationApi = {
  // BE 가 VAPID keypair 를 보유 — 공개키를 서버에서 받아 구독 생성(env 하드코딩 대체).
  getVapidKey: async (): Promise<string | null> => {
    const res = await getVapidPublicKey();
    return res.data?.publicKey ?? null;
  },
  subscribe: (subscription: PushSubscription) =>
    subscribe(toPayload(subscription)),
  unsubscribe: (endpoint: string) => unsubscribe({ endpoint }),
  // 계정에 등록된 구독 기기 목록 / 개별 해제 (설정 > 알림 기기 관리).
  listSubscriptions: async (): Promise<PushSubscriptionDto[]> => {
    const res = await getSubscriptions();
    return res.data ?? [];
  },
  removeSubscription: (id: number) => deleteSubscription(id),
};
