import { getRegion } from '@/constants/regions';
import { nearestRegion } from '@/features/location/lib/nearest-region';
import type { Coordinates, ResolvedLocation } from '@/features/location/types';

/**
 * Reverse geocoding — 좌표 → 충북 시군 라벨/regionCode.
 *
 * 4-B 전환(2026-08-08): Spring `/location/reverse` 미지원 → **클라측 시군 centroid
 * 최근접 매핑**으로 대체(BE 의존 제거). 편지 위치는 충북 11 시군 한정이라 외부
 * 지오코딩 불필요. label 은 "충북 {시군}" 근사(정확 도로명 주소는 미제공 — 트레이드오프).
 */
export const locationApi = {
  reverseGeocode: async (coords: Coordinates): Promise<ResolvedLocation> => {
    const code = nearestRegion(coords.latitude, coords.longitude);
    const region = getRegion(code);
    return {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
      label: region ? `충북 ${region.ko}` : `${code}`,
      regionCode: code,
    };
  },
};
