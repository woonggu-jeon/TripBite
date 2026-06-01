import { test, expect } from '@playwright/test';

/**
 * /api/og/[type] route 자동 검증 — 4 type 모두 200 + PNG.
 *
 * Edge runtime + Satori. jsdelivr 폰트 fetch 가 dev 에서 캐시 안 될 수 있어
 * 약간 느릴 수 있음 (테스트 timeout 충분히).
 */
test.describe('OG image route', () => {
  test.setTimeout(30_000);

  const cases = [
    {
      name: 'tournament',
      url: '/api/og/tournament?winner=청남대&region=cheongju&category=attraction&matches=4',
    },
    {
      name: 'quiz',
      url: '/api/og/quiz?type=adventurer&name=모험가&tagline=새로운%20경험을',
    },
    {
      name: 'destination',
      url: '/api/og/destination?id=cheongju-attraction-1',
    },
    { name: 'region', url: '/api/og/region?code=cheongju' },
  ];

  for (const c of cases) {
    test(`${c.name} 카드 PNG 응답`, async ({ request }) => {
      const res = await request.get(c.url);
      expect(res.status(), `${c.name} status`).toBe(200);
      const contentType = res.headers()['content-type'];
      expect(contentType, `${c.name} content-type`).toMatch(/image\/png/i);
      const buf = await res.body();
      // PNG 시그니처 (89 50 4E 47)
      expect(buf[0]).toBe(0x89);
      expect(buf[1]).toBe(0x50);
      expect(buf[2]).toBe(0x4e);
      expect(buf[3]).toBe(0x47);
      // 최소 크기 (1KB 이상이면 빈 이미지 아님)
      expect(buf.length).toBeGreaterThan(1024);
    });
  }

  test('잘못된 type 은 404', async ({ request }) => {
    const res = await request.get('/api/og/unknown');
    expect(res.status()).toBe(404);
  });
});
