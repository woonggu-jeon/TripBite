import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import type { ComposeLetterDto } from '@/api/generated/schemas';
import { mockSeeds } from '@/mocks/handlers';
import { server } from '@/mocks/server';
import { letterApi } from './letter';

/**
 * 편지 어댑터 매핑 단위 테스트 — 신규 Spring BE(ApiResponse 엔벨로프) → 도메인.
 * 실 BE 실측(GET /letters/received = {data:{items,nextCursor}}) 기준.
 */
const apiUrl = mockSeeds.apiUrl;
const ok = (data: unknown) => ({ success: true, message: null, data });

const beLetter = (over: Record<string, unknown> = {}) => ({
  id: 77,
  body: '다섯글자편',
  author: { nickname: '익명의 여행자', location: '청주' },
  arrivedAt: null,
  createdAt: '2026-07-23T00:00:00Z',
  liked: false,
  saved: false,
  likeCount: 0,
  read: false,
  isMine: true,
  ...over,
});

describe('letterApi.listReceived — 신규 BE 매핑', () => {
  it('엔벨로프 LetterPageDto → 도메인 (id number → string, nextCursor)', async () => {
    server.use(
      http.get(`${apiUrl}/letters/received`, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('cursor')).toBe('0');
        expect(url.searchParams.get('size')).toBe('10');
        return HttpResponse.json(ok({ items: [beLetter()], nextCursor: 5 }));
      }),
    );

    const page = await letterApi.listReceived(0);
    expect(page.nextCursor).toBe(5);
    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.id).toBe('77');
    expect(page.items[0]?.author.nickname).toBe('익명의 여행자');
  });
});

describe('letterApi.send — 신규 BE compose 요청/응답 매핑', () => {
  it('isAnonymous(그대로) + location → {regionCode,label}, 응답 id → string', async () => {
    let sent: Record<string, unknown> | undefined;
    server.use(
      http.post(`${apiUrl}/letters`, async ({ request }) => {
        sent = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(ok(beLetter({ id: 88 })), { status: 201 });
      }),
    );

    const dto = {
      body: '다섯글자편',
      location: { label: '청주', regionCode: 'cheongju' },
      isAnonymous: true,
    } as unknown as ComposeLetterDto;

    const res = await letterApi.send(dto);
    expect(sent).toEqual({
      body: '다섯글자편',
      location: { regionCode: 'cheongju', label: '청주' },
      isAnonymous: true,
    });
    expect(res.id).toBe('88');
  });
});

describe('letterApi.get — 실 BE 모드(정수 id) 매핑', () => {
  it('정수 id → be getById, 응답 id number → string', async () => {
    server.use(
      http.get(`${apiUrl}/letters/123`, () =>
        HttpResponse.json(ok(beLetter({ id: 123, liked: true }))),
      ),
    );

    const l = await letterApi.get('123');
    expect(l.id).toBe('123');
    expect(l.liked).toBe(true);
  });
});
