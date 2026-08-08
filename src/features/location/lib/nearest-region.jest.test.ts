import { CHUNGBUK_REGIONS } from '@/constants/regions';
import { nearestRegion } from './nearest-region';

describe('nearestRegion — 좌표 → 최근접 충북 시군', () => {
  it('각 시군 centroid 자기 좌표는 자기 자신으로 매핑', () => {
    for (const r of CHUNGBUK_REGIONS) {
      expect(nearestRegion(r.centroid.lat, r.centroid.lng)).toBe(r.code);
    }
  });

  it('청주 시청 인근 좌표 → cheongju', () => {
    // 청주 도심(성안동 근처)
    expect(nearestRegion(36.6357, 127.4914)).toBe('cheongju');
  });

  it('단양(충북 북동단) 인근 → danyang', () => {
    expect(nearestRegion(36.98, 128.36)).toBe('danyang');
  });

  it('영동(충북 최남단) 인근 → yeongdong', () => {
    expect(nearestRegion(36.17, 127.78)).toBe('yeongdong');
  });

  it('충북 밖 좌표(서울)도 가장 가까운 시군으로 귀속 — 결과는 항상 유효 시군', () => {
    const code = nearestRegion(37.5665, 126.978); // 서울시청
    expect(CHUNGBUK_REGIONS.some((r) => r.code === code)).toBe(true);
  });
});
