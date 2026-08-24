import { QueryClient } from '@tanstack/react-query';
import { act } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockSeeds } from '@/mocks/handlers';
import { server } from '@/mocks/server';
import { useAuthStore } from '@/stores/auth-store';
import { renderHookWithProviders } from '@/test-utils';
import {
  notificationKeys,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationBadge,
  useNotificationInboxInfinite,
} from './use-notification-inbox';

const apiUrl = mockSeeds.apiUrl;

describe('useNotificationInboxInfinite / useNotificationBadge — enabled 가드', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('useNotificationInboxInfinite — 비인증 시 fetch 0', () => {
    let called = 0;
    server.use(
      http.get(`${apiUrl}/notifications`, () => {
        called++;
        return HttpResponse.json({
          items: [],
          unreadCount: 0,
          nextCursor: null,
        });
      }),
    );
    const { result } = renderHookWithProviders(() =>
      useNotificationInboxInfinite(),
    );
    expect(result.current.isLoading).toBe(false);
    expect(called).toBe(0);
  });

  it('useNotificationBadge — 비인증 시 fetch 0', () => {
    let called = 0;
    server.use(
      http.get(`${apiUrl}/notifications/unread-count`, () => {
        called++;
        return HttpResponse.json({ unreadCount: 0 });
      }),
    );
    const { result } = renderHookWithProviders(() => useNotificationBadge());
    expect(result.current.fetchStatus).toBe('idle');
    expect(called).toBe(0);
  });
});

describe('useMarkNotificationRead', () => {
  it('성공 시 notificationKeys.all invalidate (inbox + badge 동시 갱신)', async () => {
    server.use(
      http.post(
        `${apiUrl}/notifications/:id/read`,
        () => new HttpResponse(null, { status: 204 }),
      ),
    );
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');

    const { result } = renderHookWithProviders(
      () => useMarkNotificationRead(),
      { queryClient: qc },
    );
    await act(async () => {
      await result.current.mutateAsync('n-1');
    });

    // inbox + badge 둘 다 invalidate — notificationKeys.all 한 번으로 cover
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: notificationKeys.all,
    });
  });
});

describe('useMarkAllNotificationsRead', () => {
  it('성공 시 notificationKeys.all invalidate', async () => {
    server.use(
      http.post(
        `${apiUrl}/notifications/read-all`,
        () => new HttpResponse(null, { status: 204 }),
      ),
    );
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');

    const { result } = renderHookWithProviders(
      () => useMarkAllNotificationsRead(),
      { queryClient: qc },
    );
    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: notificationKeys.all,
    });
  });
});
