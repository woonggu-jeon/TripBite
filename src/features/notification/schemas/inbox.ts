import { z } from 'zod';

/**
 * Notification inbox 응답 스키마 — cursor 기반 페이지네이션.
 *
 * BE 합의 (docs/API_CONTRACT.md §Notifications 추가):
 *   GET /notifications?cursor=&limit=
 *   → { items, unreadCount, nextCursor: number|null }
 *
 * `unreadCount` 는 전체 미읽음 수 (모든 페이지 통합) — 첫 페이지뿐 아니라 매 페이지
 * 응답에 포함하면 헤더 badge 가 항상 정확. 또는 첫 페이지만 보내고 이후 omit 도 가능.
 * FE 는 가장 최근 페이지의 unreadCount 를 단일 source 로 사용.
 */
export const notificationItemSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  body: z.string().optional(),
  link: z.string().optional(),
  imageUrl: z.string().optional(),
  read: z.boolean(),
  createdAt: z.string(),
});

export const notificationInboxSchema = z.object({
  items: z.array(notificationItemSchema),
  unreadCount: z.number(),
  nextCursor: z.union([z.number(), z.string(), z.null()]).optional(),
});
