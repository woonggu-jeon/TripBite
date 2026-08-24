import type {
  NotificationSettingsDto,
  UpdateNotificationSettingsDto,
} from '@/api/be/schemas';
import {
  getSettings,
  updateNotificationSettings,
} from '@/api/be/settings/settings';

/**
 * 사용자 설정 — 신규 Spring BE (`@/api/be/settings`) client wrap.
 *
 * 알림 토글: pushEnabled / inAppEnabled / letterReceived / letterLiked.
 * 신규 BE 는 `ApiResponse<SettingsDto>` 엔벨로프 → `.data` 언랩.
 * 부분 수정 시 없는(null) 필드는 BE 가 기존 값 유지.
 */
export type NotificationSettings = NotificationSettingsDto;
export type UserSettings = {
  notifications: NotificationSettings;
};

export const settingsApi = {
  get: async (signal?: AbortSignal): Promise<UserSettings> => {
    const res = await getSettings(signal);
    return { notifications: res.data?.notifications ?? {} };
  },
  updateNotifications: async (
    patch: UpdateNotificationSettingsDto,
  ): Promise<UserSettings> => {
    const res = await updateNotificationSettings(patch);
    return { notifications: res.data?.notifications ?? {} };
  },
};
