import { QueryClient } from '@tanstack/react-query';
import { act } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { mockSeeds } from '@/mocks/handlers';
import { server } from '@/mocks/server';
import { useAuthStore } from '@/stores/auth-store';
import { renderHookWithProviders } from '@/test-utils';
import {
  settingsKeys,
  useUpdateNotificationSettings,
  useUserSettings,
} from './use-notification-settings';

const apiUrl = mockSeeds.apiUrl;

// 신규 Spring BE 는 ApiResponse<T> 엔벨로프 + NotificationSettingsDto
// (pushEnabled / inAppEnabled / letterReceived / letterLiked).
const ok = (data: unknown) => ({ success: true, message: null, data });

const notifications = {
  pushEnabled: false,
  inAppEnabled: true,
  letterReceived: true,
  letterLiked: true,
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
        return HttpResponse.json(ok({ notifications }));
      }),
    );
    const { result } = renderHookWithProviders(() => useUserSettings());
    expect(result.current.fetchStatus).toBe('idle');
    expect(called).toBe(0);
  });
});

describe('useUpdateNotificationSettings', () => {
  it('성공 시 응답으로 settings.user cache 직접 setQueryData (invalidate 안 함)', async () => {
    const updated = { notifications: { ...notifications, pushEnabled: true } };
    server.use(
      http.patch(`${apiUrl}/settings/notifications`, () =>
        HttpResponse.json(ok(updated)),
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

    // 어댑터가 엔벨로프 .data 언랩 후 { notifications } 로 정규화 → 그 shape 로 캐시.
    const cached = qc.getQueryData(settingsKeys.user());
    expect(cached).toEqual(updated);
  });
});
