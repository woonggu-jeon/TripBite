'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthedQueryEnabled } from '@/features/auth/hooks/use-authed-query';
import {
  type NotificationSettings,
  settingsApi,
} from '@/features/settings/api/settings';

export const settingsKeys = {
  all: ['settings'] as const,
  user: () => [...settingsKeys.all, 'user'] as const,
};

export function useUserSettings() {
  const enabled = useAuthedQueryEnabled();
  return useQuery({
    queryKey: settingsKeys.user(),
    queryFn: ({ signal }) => settingsApi.get(signal),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 알림 설정 토글
 *
 * pushEnabled 토글 시 추가 작업:
 *   - on: usePushNotification().enable() 호출 (브라우저 권한 + subscribe)
 *   - off: usePushNotification().disable()
 * 이 hook 내부에서 호출하면 순환 의존이 생길 수 있으므로
 * 호출자(SettingsDropdown) 에서 두 동작을 순차적으로 처리.
 */
export function useUpdateNotificationSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<NotificationSettings>) =>
      settingsApi.updateNotifications(patch),
    onSuccess: (updated) => {
      qc.setQueryData(settingsKeys.user(), updated);
    },
  });
}
