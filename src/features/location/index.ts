/**
 * Location feature — Public API
 *
 * 호출부 예:
 *   const { resolve, resolved } = useResolveLocation();
 *   // navigator.geolocation 좌표 → ResolvedLocation { lat, lng, label }
 *   // BE reverse 호출 없음 — 좌표 그대로 letter 등에 전송.
 *
 * 보안/UX 원칙:
 *   - 위치 요청은 사용자 명시적 동작으로만
 *   - LocationPermissionPrompt 로 사전 안내 후 실제 prompt
 *   - 거부 시 null 반환 (사용자가 다른 입력 방식 선택)
 */
export { useGeolocation } from './hooks/use-geolocation';
export { usePermissionState } from './hooks/use-permission-state';
export { useResolveLocation } from './hooks/use-resolve-location';
export { LocationPermissionPrompt } from './components/LocationPermissionPrompt';
export { locationApi } from './api/location';
export type {
  Coordinates,
  ResolvedLocation,
  GeolocationError,
  GeolocationErrorCode,
  PermissionState,
} from './types';
