import { z } from 'zod';

/**
 * Notification inbox 응답 스키마.
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
});
