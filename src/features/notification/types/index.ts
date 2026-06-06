/**
 * 인앱 알림함 도메인 — orval generated DTO + enum alias.
 *
 * BE swagger 가 `AppNotificationType` enum 명시 → generated 가 자동 narrowing.
 * FE 측 `Omit + intersection` 폐기.
 */
import type {
  AppNotificationDto,
  AppNotificationType,
  NotificationListDto,
} from '@/api/generated/schemas';

export type NotificationType = AppNotificationType;
export type AppNotification = AppNotificationDto;
export type NotificationInbox = NotificationListDto;
