import {
  getList1,
  getUnreadCount,
  read,
  readAll,
} from '@/api/be/notification/notification';
import type { NotificationListDto } from '@/api/generated/schemas';

/**
 * 인앱 알림함 API — 신규 Spring BE (`@/api/be/notification`) client wrap.
 *
 * 엔드포인트 (BE Swagger §Notification):
 *   GET    /notifications?cursor=&size=   — 인박스 (커서 페이지) → ApiResponse<NotificationListDto>
 *   GET    /notifications/unread-count     — badge 경량 조회 → ApiResponse<UnreadCountDto>
 *   POST   /notifications/{id}/read        — 단건 읽음 (멱등)
 *   POST   /notifications/read-all         — 일괄 읽음
 *
 * 마이그 노트: 신규 BE 는 `ApiResponse<T>` 엔벨로프 → `.data` 언랩.
 * item id 가 number → 도메인(구 generated shape)은 string 이라 String() 정규화.
 * enum(type)·필드(read/body/link/createdAt) 는 구/신 동일해 추가 매핑 불필요.
 */
export const notificationInboxApi = {
  /**
   * cursor=null/undefined → 첫 페이지. 응답의 nextCursor 가 null 이면 마지막 페이지.
   * useInfiniteList 가 `{items, nextCursor, unreadCount}` shape 기대.
   */
  getPage: async (params: {
    cursor?: number | string | null;
    limit?: number;
  }): Promise<NotificationListDto> => {
    const res = await getList1({
      cursor: params.cursor != null ? Number(params.cursor) : undefined,
      size: params.limit,
    });
    const data = res.data;
    return {
      items: (data?.items ?? []).map((n) => ({
        id: String(n.id ?? ''),
        type: n.type as NotificationListDto['items'][number]['type'],
        title: n.title ?? '',
        body: n.body ?? undefined,
        link: n.link ?? undefined,
        read: n.read ?? false,
        createdAt: n.createdAt ?? '',
      })),
      unreadCount: data?.unreadCount ?? 0,
      nextCursor: data?.nextCursor ?? null,
    };
  },
  unreadCount: async (): Promise<{ unreadCount: number }> => {
    const res = await getUnreadCount();
    return { unreadCount: res.data?.unreadCount ?? 0 };
  },
  markRead: (id: string) => read(Number(id)),
  markAllRead: () => readAll(),
};
