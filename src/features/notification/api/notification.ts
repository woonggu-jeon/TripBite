import { api } from '@/services/api/client';

type PushSubscriptionPayload = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

function toPayload(subscription: PushSubscription): PushSubscriptionPayload {
  const json = subscription.toJSON();
  return {
    endpoint: json.endpoint ?? subscription.endpoint,
    keys: {
      p256dh: json.keys?.p256dh ?? '',
      auth: json.keys?.auth ?? '',
    },
  };
}

export const notificationApi = {
  subscribe: async (subscription: PushSubscription) => {
    await api.post('/notifications/subscribe', toPayload(subscription));
  },
  unsubscribe: async (endpoint: string) => {
    await api.post('/notifications/unsubscribe', { endpoint });
  },
};
