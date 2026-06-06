import {
  notificationControllerListV1,
  notificationControllerMarkReadV1,
  notificationControllerReadAllV1,
} from '@/api/generated/notifications/notifications';

/**
 * 인앱 알림함 API — orval 가 BE swagger 로 자동 생성한 client functions wrap.
 *
 * 엔드포인트 (docs/API_CONTRACT.md §Notifications):
 *   GET    /notifications?cursor=&limit=  — 인박스 (페이지) → NotificationListDto
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
  markRead: notificationControllerMarkReadV1,
  markAllRead: notificationControllerReadAllV1,
};
