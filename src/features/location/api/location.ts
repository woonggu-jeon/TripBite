import { getRegion } from '@/constants/regions';
import { nearestRegion } from '@/features/location/lib/nearest-region';
import type { Coordinates, ResolvedLocation } from '@/features/location/types';
import { api } from '@/services/api/client';

/**
 * Reverse geocoding — 좌표 → 위치 라벨/regionCode.
 *
 * 우선순위:
 *   1) BE `POST /location/reverse` (좌표 → 실제 행정구역 라벨 + regionCode) — 원 기획.
 *   2) BE 미구현/실패 시 폴백: 클라측 충북 11시군 centroid 최근접 매핑.
 *
 * 배경: 원 설계는 BE 역지오코딩이었으나 Spring 미지원(2026-08, swagger 부재)이라
 * 클라 근사 스냅으로 대체했었다. BE 가 `/location/reverse` 추가하면(§BE_API_REQUEST)
 * 자동으로 실주소 라벨을 쓰고, 그때까지는 폴백이 regionCode 를 보장한다(편지 위치 필수).
 */
export const locationApi = {
  reverseGeocode: async (coords: Coordinates): Promise<ResolvedLocation> => {
    // 1) BE 역지오코딩 우선. 있으면 실제 주소 라벨.
    try {
      const res = await api.post<{
        success: boolean;
        message: string | null;
        data: ResolvedLocation | null;
      }>('/location/reverse', coords);
      const d = res.data?.data;
      if (d?.regionCode) {
        return {
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
          label: d.label,
          regionCode: d.regionCode,
        };
      }
    } catch {
      // BE 미구현(현재 403/부재) 또는 일시 오류 → 폴백. (throw 안 함)
    }

    // 2) 폴백: 클라 충북 최근접 시군(실패 없음). BE 도입 시 이 경로 미사용.
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
