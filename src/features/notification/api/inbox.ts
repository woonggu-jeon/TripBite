import { api } from '@/services/api/client';
import { safeParseResponse } from '@/lib/safe-parse-response';
import { notificationInboxSchema } from '@/features/notification/schemas/inbox';
import type { NotificationInbox } from '@/features/notification/types';

/**
 * 인앱 알림함 API — cursor 기반 페이지네이션.
 *
 * 엔드포인트 (docs/API_CONTRACT.md §Notifications):
 *   GET    /notifications?cursor=&limit=  — 인박스 (페이지)
 *   POST   /notifications/:id/read        — 단건 읽음 (204 / 멱등)
 *   POST   /notifications/read-all        — 일괄 읽음 (204)
 *
 * Push와의 관계:
 *   - Push 는 OS 레벨 알림 (앱 종료 상태에서도 받음)
 *   - 인앱 알림함은 앱 안 알림 센터 — 백엔드가 동일 이벤트를 양쪽에 발행
 */
export const notificationInboxApi = {
  /**
   * cursor=null/undefined → 첫 페이지. 응답의 nextCursor 가 null 이면 마지막 페이지.
   * useInfiniteList 가 `{items, nextCursor}` shape 기대 — 그대로 호환.
   */
  getPage: async (params: {
    cursor?: number | string | null;
    limit?: number;
  }): Promise<NotificationInbox> => {
    const res = await api.get<unknown>('/notifications', {
      params: {
        cursor: params.cursor ?? undefined,
        limit: params.limit,
      },
    });
    return safeParseResponse(
      notificationInboxSchema,
      res.data,
      'GET /notifications',
    ) as NotificationInbox;
  },
  markRead: async (id: string) => {
    await api.post(`/notifications/${id}/read`);
  },
  markAllRead: async () => {
    await api.post('/notifications/read-all');
  },
};
