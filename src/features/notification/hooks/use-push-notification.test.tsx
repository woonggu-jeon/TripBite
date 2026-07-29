import { act, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHookWithProviders } from '@/test-utils';

const subscriptionUtils = vi.hoisted(() => ({
  isPushSupported: vi.fn<() => Promise<boolean>>(),
  requestNotificationPermission: vi.fn<() => Promise<NotificationPermission>>(),
  getOrCreatePushSubscription:
    vi.fn<(k: string) => Promise<PushSubscription | null>>(),
  unsubscribePush: vi.fn<() => Promise<void>>(),
}));

vi.mock('@/features/notification/utils/subscription', () => subscriptionUtils);

vi.mock('@/features/notification/api/notification', () => ({
  notificationApi: {
    subscribe: vi.fn<() => Promise<void>>(),
    unsubscribe: vi.fn<() => Promise<void>>(),
  },
}));

const { usePushNotification } = await import('./use-push-notification');

describe('usePushNotification', () => {
  beforeEach(() => {
    subscriptionUtils.isPushSupported.mockReset();
    subscriptionUtils.requestNotificationPermission.mockReset();
    subscriptionUtils.getOrCreatePushSubscription.mockReset();
    subscriptionUtils.unsubscribePush.mockReset();
    // service worker getRegistration default
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        getRegistration: vi.fn(() => Promise.resolve(null)),
        ready: Promise.resolve({
          pushManager: { getSubscription: vi.fn(() => Promise.resolve(null)) },
        }),
      },
    });
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('unsupported → status: unsupported', async () => {
    subscriptionUtils.isPushSupported.mockResolvedValue(false);
    const { result } = renderHookWithProviders(() => usePushNotification());

    await act(async () => {
      await result.current.enable();
    });

    await waitFor(() => {
      expect(result.current.status).toBe('unsupported');
    });
  });

  it('permission denied → status: denied', async () => {
    subscriptionUtils.isPushSupported.mockResolvedValue(true);
    subscriptionUtils.requestNotificationPermission.mockResolvedValue('denied');
    const { result } = renderHookWithProviders(() => usePushNotification());

    await act(async () => {
      await result.current.enable();
    });

    await waitFor(() => {
      expect(result.current.status).toBe('denied');
    });
  });

  it('granted + no SW → status: enabled (권한만 잡힘)', async () => {
    subscriptionUtils.isPushSupported.mockResolvedValue(true);
    subscriptionUtils.requestNotificationPermission.mockResolvedValue(
      'granted',
    );
    // serviceWorker.getRegistration → null (no SW)
    const { result } = renderHookWithProviders(() => usePushNotification());

    await act(async () => {
      await result.current.enable();
    });

    await waitFor(() => {
      expect(result.current.status).toBe('enabled');
    });
  });

  it('granted + SW + no VAPID 키 → status: enabled (subscribe 호출 안 함)', async () => {
    subscriptionUtils.isPushSupported.mockResolvedValue(true);
    subscriptionUtils.requestNotificationPermission.mockResolvedValue(
      'granted',
    );
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        getRegistration: vi.fn(() =>
          Promise.resolve({ active: { state: 'activated' } } as unknown),
        ),
        ready: Promise.resolve({
          pushManager: { getSubscription: vi.fn(() => Promise.resolve(null)) },
        }),
      },
    });

    const { result } = renderHookWithProviders(() => usePushNotification());

    await act(async () => {
      await result.current.enable();
    });

    await waitFor(() => {
      expect(result.current.status).toBe('enabled');
    });
    expect(
      subscriptionUtils.getOrCreatePushSubscription,
    ).not.toHaveBeenCalled();
  });

  it('granted + SW + VAPID 키 + subscription 생성 성공 → status: enabled + subscribe 호출', async () => {
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'test-key';
    subscriptionUtils.isPushSupported.mockResolvedValue(true);
    subscriptionUtils.requestNotificationPermission.mockResolvedValue(
      'granted',
    );
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        getRegistration: vi.fn(() =>
          Promise.resolve({ active: { state: 'activated' } } as unknown),
        ),
        ready: Promise.resolve({
          pushManager: { getSubscription: vi.fn(() => Promise.resolve(null)) },
        }),
      },
    });
    subscriptionUtils.getOrCreatePushSubscription.mockResolvedValue({
      endpoint: 'https://push.example/x',
      toJSON: () => ({ endpoint: 'https://push.example/x', keys: {} }),
    } as unknown as PushSubscription);

    const { result } = renderHookWithProviders(() => usePushNotification());

    await act(async () => {
      await result.current.enable();
    });

    await waitFor(() => {
      expect(result.current.status).toBe('enabled');
    });
    expect(subscriptionUtils.getOrCreatePushSubscription).toHaveBeenCalledWith(
      'test-key',
    );
  });
});
