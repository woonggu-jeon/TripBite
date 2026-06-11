import {
  notificationControllerListV1,
  notificationControllerMarkReadV1,
  notificationControllerReadAllV1,
} from '@/api/generated/notifications/notifications';
import { orvalMutator } from '@/services/api/orval-mutator';

/**
 * 인앱 알림함 API — orval 가 BE swagger 로 자동 생성한 client functions wrap.
 *
 * 엔드포인트 (BE Swagger §Notifications):
 *   GET    /notifications?cursor=&limit=  — 인박스 (페이지) → NotificationListDto
 *   GET    /notifications/unread-count    — badge 경량 조회 → { unreadCount }
 *   POST   /notifications/:id/read        — 단건 읽음 (204 / 멱등)
 *   POST   /notifications/read-all        — 일괄 읽음 (204)
 */
export const notificationInboxApi = {
  /**
   * cursor=null/undefined → 첫 페이지. 응답의 nextCursor 가 null 이면 마지막 페이지.
   * useInfiniteList 가 `{items, nextCursor}` shape 기대 — generated DTO 그대로 호환.
   */
  getPage: (params: { cursor?: number | string | null; limit?: number }) =>
    // generated Params 가 string only — number/null 정규화.
    notificationControllerListV1({
      cursor: params.cursor != null ? String(params.cursor) : undefined,
      limit: params.limit != null ? String(params.limit) : undefined,
    }),
  /**
   * 헤더 badge 용 경량 조회 — 인박스 fetch 없이 unreadCount 만.
   * BE 가 운영 docs-json 미노출이라 orval 재생성 못 함 → 직접 wrap.
   * BE swagger 노출 시 generated 함수로 교체 가능.
   */
  unreadCount: () =>
    orvalMutator<{ unreadCount: number }>({
      url: '/v1/notifications/unread-count',
      method: 'GET',
    }),
  markRead: notificationControllerMarkReadV1,
  markAllRead: notificationControllerReadAllV1,
};
