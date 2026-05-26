/**
 * Location feature — Public API
 *
 * 호출부 예:
 *   import { useResolveLocation, LocationPermissionPrompt } from '@/features/location';
 *
 *   function LetterCompose() {
 *     const { resolve, resolved } = useResolveLocation();
 *     return (
 *       <>
 *         <button onClick={resolve}>위치 자동 입력</button>
 *         {resolved && <span>{resolved.label}</span>}
 *       </>
 *     );
 *   }
 *
 * 보안/UX 원칙:
 *   - 위치 요청은 사용자 명시적 동작으로만
 *   - LocationPermissionPrompt 로 사전 안내 후 실제 prompt
 *   - 거부 시 IP 기반 fallback 자동 시도
 *   - 결과는 백엔드에서 reverseGeocode → label 까지 변환
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
