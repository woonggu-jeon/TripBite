import { api } from '@/services/api/client';

/**
 * 사용자 설정
 *
 * 메뉴 요구사항: "알림 유무 설정"
 * → 서버 측 toggle (인앱 알림, 푸시 알림 각각 별도 권장)
 */
export type NotificationSettings = {
  pushEnabled: boolean;     // Web Push 수신 여부
  inAppEnabled: boolean;    // 인앱 알림함 사용 여부
  letterReceived: boolean;  // 편지 도착 알림
  letterLiked: boolean;     // 내 편지에 좋아요 알림
};

export type UserSettings = {
  notifications: NotificationSettings;
  // 추후 확장 (테마, 언어, 위치 권한 등)
};

export const settingsApi = {
  get: async (): Promise<UserSettings> => {
    const res = await api.get<UserSettings>('/settings');
    return res.data;
  },

  updateNotifications: async (
    patch: Partial<NotificationSettings>,
  ): Promise<UserSettings> => {
    const res = await api.patch<UserSettings>('/settings/notifications', patch);
    return res.data;
  },
};
