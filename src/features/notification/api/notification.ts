import { subscribe, unsubscribe } from '@/api/be/notification/notification';

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
 * Web Push subscribe / unsubscribe — 신규 Spring BE (`@/api/be/notification`) client wrap.
 *
 * BE 가 VAPID + endpoint upsert.
 *   POST /notifications/subscribe   {endpoint, keys:{p256dh, auth}}
 *   POST /notifications/unsubscribe {endpoint}
 */
export const notificationApi = {
  subscribe: (subscription: PushSubscription) =>
    subscribe(toPayload(subscription)),
  unsubscribe: (endpoint: string) => unsubscribe({ endpoint }),
};
