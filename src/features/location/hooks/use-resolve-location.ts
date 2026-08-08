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
 *   2) locationApi.reverseGeocode → 클라 시군 최근접 매핑 { label, regionCode }
 *      (4-B 전환: BE reverse 의존 제거 — 순수 클라 계산이라 실패 없음)
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
      // 클라 시군 최근접 매핑 — regionCode/label 확보 (실패 없음).
      const result = await locationApi.reverseGeocode(coords);
      setResolved(result);
      return result;
    } catch (err) {
      setError({ code: 'unavailable', rawMessage: String(err) });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [requestGps]);

  return { resolved, error, isLoading, resolve };
}
