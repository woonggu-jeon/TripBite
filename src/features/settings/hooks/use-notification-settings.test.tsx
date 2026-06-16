import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { mockSeeds } from '@/mocks/handlers';
import { renderHookWithProviders } from '@/test-utils';
import { useAuthStore } from '@/stores/auth-store';
import {
  settingsKeys,
  useUpdateNotificationSettings,
  useUserSettings,
} from './use-notification-settings';

const apiUrl = mockSeeds.apiUrl;

const mockSettings = {
  notifications: {
    pushEnabled: false,
    letterArrivedEnabled: true,
    festivalEnabled: true,
    securityEnabled: true,
  },
} as const;

describe('useUserSettings — enabled: isAuthenticated 가드', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('비인증 시 fetch 0', () => {
    let called = 0;
    server.use(
      http.get(`${apiUrl}/settings`, () => {
        called++;
        return HttpResponse.json(mockSettings);
      }),
    );
    const { result } = renderHookWithProviders(() => useUserSettings());
    expect(result.current.fetchStatus).toBe('idle');
    expect(called).toBe(0);
  });
});

describe('useUpdateNotificationSettings', () => {
  it('성공 시 응답으로 settings.user cache 직접 setQueryData (invalidate 안 함)', async () => {
    const updated = {
      ...mockSettings,
      notifications: { ...mockSettings.notifications, pushEnabled: true },
    };
    server.use(
      http.patch(`${apiUrl}/settings/notifications`, () =>
        HttpResponse.json(updated),
      ),
    );
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });

    const { result } = renderHookWithProviders(
      () => useUpdateNotificationSettings(),
      { queryClient: qc },
    );
    await act(async () => {
      await result.current.mutateAsync({ pushEnabled: true });
    });

    const cached = qc.getQueryData(settingsKeys.user());
    expect(cached).toEqual(updated);
  });
});
