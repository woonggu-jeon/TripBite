import { CHUNGBUK_REGIONS, type RegionCode } from '@/constants/regions';

/**
 * GPS 좌표 → 최근접 충북 시군.
 *
 * 편지 위치는 충북 11 시군 중 하나여야 하므로(BE 계약: regionCode 필수 enum),
 * 서버 reverse-geocoding 없이 클라에서 시군 centroid 최근접으로 매핑한다.
 * 충북 밖 좌표도 가장 가까운 시군으로 귀속(근사) — 편지 도메인이 충북 한정이라 허용.
 *
 * 거리: 소영역(충북 ~1.5° span)이라 등거원통 근사(경도에 cos(위도) 보정)로 충분.
 */
export function nearestRegion(lat: number, lng: number): RegionCode {
  const latRad = (lat * Math.PI) / 180;
  const cosLat = Math.cos(latRad);

  let best: RegionCode = CHUNGBUK_REGIONS[0].code;
  let bestDist = Infinity;
  for (const region of CHUNGBUK_REGIONS) {
    const dLat = lat - region.centroid.lat;
    const dLng = (lng - region.centroid.lng) * cosLat;
    const dist = dLat * dLat + dLng * dLng;
    if (dist < bestDist) {
      bestDist = dist;
      best = region.code;
    }
  }
  return best;
}
