import {
  notificationControllerSubscribeV1,
  notificationControllerUnsubscribeV1,
} from '@/api/generated/notifications/notifications';

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
 * Web Push subscribe / unsubscribe — orval generated client wrap.
 *
 * BE 가 VAPID + endpoint upsert.
 *   POST /notifications/subscribe   {endpoint, keys:{p256dh, auth}}
 *   POST /notifications/unsubscribe {endpoint}
 */
export const notificationApi = {
  subscribe: (subscription: PushSubscription) =>
    notificationControllerSubscribeV1(toPayload(subscription)),
  unsubscribe: (endpoint: string) =>
    notificationControllerUnsubscribeV1({ endpoint }),
};
