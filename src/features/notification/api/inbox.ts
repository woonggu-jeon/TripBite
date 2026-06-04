import { api } from '@/services/api/client';
import { safeParseResponse } from '@/lib/safe-parse-response';
import { notificationInboxSchema } from '@/features/notification/schemas/inbox';
import type { NotificationInbox } from '@/features/notification/types';

/**
 * 인앱 알림함 API
 *
 * 엔드포인트 예시:
 *   GET    /notifications              — 인박스
 *   POST   /notifications/:id/read     — 단건 읽음
 *   POST   /notifications/read-all     — 일괄 읽음
 *
 * 폴링 vs SSE/WebSocket:
 *   - 초기엔 폴링 (TanStack Query refetchInterval) 으로 충분
 *   - 트래픽 증가 시 SSE 또는 WebSocket으로 교체
 *
 * Push와의 관계:
 *   - Push는 OS 레벨 알림 (앱 종료 상태에서도 받음)
 *   - 인앱 알림함은 앱 안 알림 센터 — 백엔드가 동일 이벤트를 양쪽에 발행
 */
export const notificationInboxApi = {
  get: async (): Promise<NotificationInbox> => {
    const res = await api.get<unknown>('/notifications');
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
