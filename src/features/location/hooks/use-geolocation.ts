'use client';

import { useCallback, useRef, useState } from 'react';
import type {
  Coordinates,
  GeolocationError,
  PermissionState,
} from '@/features/location/types';
import { usePermissionState } from './use-permission-state';

type Options = {
  /** GPS 등 고정밀 모드 — 배터리 소모 큼 */
  enableHighAccuracy?: boolean;
  /** ms */
  timeout?: number;
  /** 캐시된 위치 허용 시간 (ms) */
  maximumAge?: number;
};

/**
 * 위치 정보 훅
 *
 * 핵심:
 *   - getCurrentPosition은 **사용자 동작 직후에만** 호출 (iOS 정책)
 *   - 자동 호출하지 않음 → request() 를 명시적으로 호출
 *   - 권한 상태는 usePermissionState로 별도 추적
 *
 * 사용 패턴:
 *   const { permission, request, position, error, isLoading } = useGeolocation();
 *
 *   <button onClick={request} disabled={isLoading}>
 *     {permission === 'granted' ? '위치 갱신' : '위치 허용'}
 *   </button>
 *
 * 에러 매핑:
 *   PositionError.code (1=denied, 2=unavailable, 3=timeout)
 *   → 앱 도메인 enum 으로 변환
 */
export function useGeolocation(options: Options = {}) {
  const permission = usePermissionState();
  const [position, setPosition] = useState<Coordinates | null>(null);
  const [error, setError] = useState<GeolocationError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 동시에 여러 번 호출되는 것 방지
  const inFlight = useRef(false);

  const request = useCallback((): Promise<Coordinates | null> => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError({ code: 'unsupported' });
      return Promise.resolve(null);
    }
    if (inFlight.current) return Promise.resolve(position);
    inFlight.current = true;
    setIsLoading(true);
    setError(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: Coordinates = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
          setPosition(coords);
          setIsLoading(false);
          inFlight.current = false;
          resolve(coords);
        },
        (err) => {
          const mapped: GeolocationError = {
            code:
              err.code === err.PERMISSION_DENIED
                ? 'permission-denied'
                : err.code === err.POSITION_UNAVAILABLE
                  ? 'unavailable'
                  : err.code === err.TIMEOUT
                    ? 'timeout'
                    : 'unavailable',
            rawMessage: err.message,
          };
          setError(mapped);
          setIsLoading(false);
          inFlight.current = false;
          resolve(null);
        },
        {
          enableHighAccuracy: options.enableHighAccuracy ?? false,
          timeout: options.timeout ?? 10_000,
          maximumAge: options.maximumAge ?? 60_000,
        },
      );
    });
  }, [
    options.enableHighAccuracy,
    options.maximumAge,
    options.timeout,
    position,
  ]);

  return {
    permission: permission satisfies PermissionState,
    position,
    error,
    isLoading,
    request,
  };
}
