import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import { mockSeeds } from '@/mocks/handlers';
import { server } from '@/mocks/server';
import { locationApi } from './location';

/**
 * reverseGeocode — BE /location/reverse 우선, 미구현/실패 시 클라 최근접 폴백.
 */
const apiUrl = mockSeeds.apiUrl;
// 청주 시청 근처 좌표
const cheongju = { latitude: 36.642, longitude: 127.489, accuracy: 10 };

describe('locationApi.reverseGeocode', () => {
  it('BE /location/reverse 응답 있으면 그 라벨/코드 사용', async () => {
    server.use(
      http.post(`${apiUrl}/location/reverse`, () =>
        HttpResponse.json({
          success: true,
          message: null,
          data: { label: '충청북도 청주시 상당구', regionCode: 'cheongju' },
        }),
      ),
    );
    const r = await locationApi.reverseGeocode(cheongju);
    expect(r.label).toBe('충청북도 청주시 상당구');
    expect(r.regionCode).toBe('cheongju');
    expect(r.latitude).toBe(cheongju.latitude);
  });

  it('BE 미구현(403) → 클라 최근접 시군 폴백', async () => {
    server.use(
      http.post(
        `${apiUrl}/location/reverse`,
        () => new HttpResponse(null, { status: 403 }),
      ),
    );
    const r = await locationApi.reverseGeocode(cheongju);
    // 청주 좌표 → 최근접 cheongju
    expect(r.regionCode).toBe('cheongju');
    expect(r.label).toContain('충북');
  });

  it('BE 응답 regionCode 누락 → 폴백', async () => {
    server.use(
      http.post(`${apiUrl}/location/reverse`, () =>
        HttpResponse.json({ success: true, message: null, data: {} }),
      ),
    );
    const r = await locationApi.reverseGeocode(cheongju);
    expect(r.regionCode).toBe('cheongju');
  });
});
