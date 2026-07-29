import type {
  NotificationSettingsDto,
  UpdateNotificationSettingsDto,
} from '@/api/generated/schemas';
import {
  settingsControllerGetV1,
  settingsControllerUpdateNotificationsV1,
} from '@/api/generated/settings/settings';

/**
 * 사용자 설정 — orval generated client wrap.
 *
 * 알림 토글: pushEnabled / inAppEnabled / letterReceived / letterLiked.
 */
export type NotificationSettings = NotificationSettingsDto;
export type UserSettings = {
  notifications: NotificationSettings;
};

export const settingsApi = {
  get: () => settingsControllerGetV1() as Promise<UserSettings>,
  updateNotifications: (patch: UpdateNotificationSettingsDto) =>
    settingsControllerUpdateNotificationsV1(patch) as Promise<UserSettings>,
};
