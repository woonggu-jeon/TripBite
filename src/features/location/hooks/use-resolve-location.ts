'use client';

import { useCallback, useState } from 'react';
import { locationApi } from '@/features/location/api/location';
import type {
  GeolocationError,
  ResolvedLocation,
} from '@/features/location/types';
import { useGeolocation } from './use-geolocation';

/**
 * GPS 좌표 + BE reverse geocoding → 한글 라벨 확보.
 *
 * 흐름:
 *   1) navigator.geolocation → { latitude, longitude }
 *   2) POST /v1/location/reverse → { label, regionCode? } (BE 가 Kakao wrap)
 *   3) reverse 실패 시 fallback: 좌표 표시 label 로 진행
 *
 * 호출은 항상 사용자 동작 직후에 (resolve()).
 * 컴포넌트 mount 시 자동 호출 X.
 */
export function useResolveLocation() {
  const { request: requestGps } = useGeolocation();
  const [resolved, setResolved] = useState<ResolvedLocation | null>(null);
  const [error, setError] = useState<GeolocationError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const resolve = useCallback(async (): Promise<ResolvedLocation | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const coords = await requestGps();
      if (!coords) {
        setError({ code: 'permission-denied' });
        return null;
      }
      try {
        const result = await locationApi.reverseGeocode(coords);
        setResolved(result);
        return result;
      } catch {
        // reverse 실패 (네트워크 / 401 / 500) — 좌표 표시 fallback 으로 진행.
        const fallback: ResolvedLocation = {
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
          label: `${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)}`,
        };
        setResolved(fallback);
        return fallback;
      }
    } catch (err) {
      setError({ code: 'unavailable', rawMessage: String(err) });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [requestGps]);

  return { resolved, error, isLoading, resolve };
}
