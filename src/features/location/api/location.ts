import { locationControllerReverseV1 } from '@/api/generated/location/location';
import type { Coordinates, ResolvedLocation } from '@/features/location/types';

/**
 * Reverse geocoding API — orval generated client wrap.
 *
 * BE 가 Kakao/Naver reverse 로 좌표 → 한글 행정구역 라벨 변환.
 *   POST /v1/location/reverse { latitude, longitude } → ResolvedLocation
 *
 * 응답 label 예: "서울시 용산구", "충북 청주시 상당구". regionCode 는 충북 한정.
 */
export const locationApi = {
  reverseGeocode: (coords: Coordinates) =>
    locationControllerReverseV1(coords) as Promise<ResolvedLocation>,
};
