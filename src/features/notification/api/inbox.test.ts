import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import { mockSeeds } from '@/mocks/handlers';
import { server } from '@/mocks/server';
import { notificationInboxApi } from './inbox';

/**
 * 알림 인박스 어댑터 매핑 단위 테스트 — 신규 Spring BE 엔벨로프 → 도메인.
 * 핵심 위험: ApiResponse<T> `.data` 언랩 + item id(number) → 도메인(string) 정규화.
 */
const apiUrl = mockSeeds.apiUrl;
const ok = (data: unknown) => ({ success: true, message: null, data });

describe('notificationInboxApi.getPage — 신규 BE 매핑', () => {
  it('엔벨로프 언랩 + item id number→string + 필드 그대로', async () => {
    server.use(
      http.get(`${apiUrl}/notifications`, () =>
        HttpResponse.json(
          ok({
            items: [
              {
                id: 42,
                type: 'letter.received',
                title: '새 편지',
                body: '도착',
                link: '/letter/42',
                read: false,
                createdAt: '2026-08-06T00:00:00Z',
              },
            ],
            unreadCount: 3,
            nextCursor: 1,
          }),
        ),
      ),
    );

    const page = await notificationInboxApi.getPage({ limit: 20 });
    expect(page.items).toHaveLength(1);
    const first = page.items[0]!;
    expect(first.id).toBe('42');
    expect(first.type).toBe('letter.received');
    expect(first.read).toBe(false);
    expect(page.unreadCount).toBe(3);
    expect(page.nextCursor).toBe(1);
  });

  it('data 누락 시 안전 기본값 (items: [], unreadCount: 0, nextCursor: null)', async () => {
    server.use(
      http.get(`${apiUrl}/notifications`, () =>
        HttpResponse.json({ success: true, message: null, data: null }),
      ),
    );

    const page = await notificationInboxApi.getPage({});
    expect(page.items).toEqual([]);
    expect(page.unreadCount).toBe(0);
    expect(page.nextCursor).toBeNull();
  });
});

describe('notificationInboxApi.unreadCount — 신규 BE 매핑', () => {
  it('엔벨로프 .data.unreadCount 언랩', async () => {
    server.use(
      http.get(`${apiUrl}/notifications/unread-count`, () =>
        HttpResponse.json(ok({ unreadCount: 7 })),
      ),
    );

    const res = await notificationInboxApi.unreadCount();
    expect(res.unreadCount).toBe(7);
  });
});
