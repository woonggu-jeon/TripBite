import { api } from '@/services/api/client';
import type {
  Coordinates,
  ResolvedLocation,
} from '@/features/location/types';

/**
 * 위치 관련 API
 *
 * reverseGeocode:
 *   - 좌표를 사람이 읽을 수 있는 주소로 변환
 *   - 백엔드가 Kakao/Naver Maps Reverse Geocoding API를 프록시
 *     (API 키 노출 방지 + 캐싱 + 비용 관리)
 *
 * fromIp:
 *   - geolocation 권한 거부/실패 시 IP 기반 대략적 위치 반환
 *   - 백엔드가 IP geolocation 서비스 사용
 *   - 정확도는 시/도 수준
 *
 * 백엔드 엔드포인트 예시:
 *   POST /location/reverse  { latitude, longitude } → ResolvedLocation
 *   GET  /location/ip                                → ResolvedLocation
 */
export const locationApi = {
  reverseGeocode: async (coords: Coordinates): Promise<ResolvedLocation> => {
    const res = await api.post<ResolvedLocation>('/location/reverse', coords);
    return res.data;
  },

  fromIp: async (): Promise<ResolvedLocation> => {
    const res = await api.get<ResolvedLocation>('/location/ip');
    return res.data;
  },
};
