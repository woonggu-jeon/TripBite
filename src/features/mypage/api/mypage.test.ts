import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import { mockSeeds } from '@/mocks/handlers';
import { server } from '@/mocks/server';
import { mypageApi } from './mypage';

/**
 * mypage 어댑터 매핑 단위 테스트 — 신규 Spring BE stamps 엔벨로프 → 도메인.
 */
const apiUrl = mockSeeds.apiUrl;
const ok = (data: unknown) => ({ success: true, message: null, data });

describe('mypageApi.getStamps — 신규 BE 도장 매핑', () => {
  it('엔벨로프 {visited,total} → 도메인 StampsDto', async () => {
    server.use(
      http.get(`${apiUrl}/mypage/stamps`, () =>
        HttpResponse.json(ok({ visited: ['cheongju', 'danyang'], total: 11 })),
      ),
    );

    const s = await mypageApi.getStamps();
    expect(s.visited).toEqual(['cheongju', 'danyang']);
    expect(s.total).toBe(11);
  });

  it('data 누락 시 안전 기본값 (visited: [], total: 0)', async () => {
    server.use(
      http.get(`${apiUrl}/mypage/stamps`, () =>
        HttpResponse.json({ success: true, message: null, data: null }),
      ),
    );

    const s = await mypageApi.getStamps();
    expect(s.visited).toEqual([]);
    expect(s.total).toBe(0);
  });
});
