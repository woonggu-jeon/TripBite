import { api } from '@/services/api/client';
import type { Coordinates, ResolvedLocation } from '@/features/location/types';

/**
 * Reverse geocoding — 좌표 → 한글 행정구역 라벨 변환.
 *   POST /location/reverse { latitude, longitude } → ResolvedLocation
 *
 * ⚠️ Spring BE 미지원 (2026-08 기준 swagger 에 없음) — MSW mock 으로만 동작.
 *    실 BE 연동은 BE 가 `/location/reverse` 추가해야 함 (BE_REQUEST 문서 참조).
 */
export const locationApi = {
  reverseGeocode: async (coords: Coordinates): Promise<ResolvedLocation> => {
    const res = await api.post<ResolvedLocation>('/location/reverse', coords);
    return res.data;
  },
};
