import { api } from '@/services/api/client';
import type { Coordinates, ResolvedLocation } from '@/features/location/types';

/**
 * Reverse geocoding API.
 *
 * BE 가 Kakao/Naver reverse wrap 으로 좌표 → 한글 행정구역 라벨 변환.
 *
 * 엔드포인트:
 *   POST /location/reverse  { latitude, longitude } → ResolvedLocation
 *
 * 응답 label 예: "서울시 용산구", "충북 청주시 상당구" — BE 응답 그대로 표시.
 * regionCode 는 충북 한정에서만 채워질 수 있음 (전국 좌표는 undefined 가능).
 */
export const locationApi = {
  reverseGeocode: async (coords: Coordinates): Promise<ResolvedLocation> => {
    const res = await api.post<ResolvedLocation>('/location/reverse', coords);
    return res.data;
  },
};
