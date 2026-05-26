'use client';

import { useCallback, useState } from 'react';
import { useGeolocation } from './use-geolocation';
import { locationApi } from '@/features/location/api/location';
import type {
  GeolocationError,
  ResolvedLocation,
} from '@/features/location/types';

/**
 * "사용 가능한 모든 수단으로 위치 확보" 훅
 *
 * 시도 순서:
 *   1) navigator.geolocation (정확)
 *      → 성공 시 reverseGeocode → label 까지 얻음
 *   2) 실패/거부 시 IP 기반 fallback (대략적)
 *
 * 사용처:
 *   - 편지 작성: 보낸 위치 자동 채우기
 *   - 홈 위젯: 현재 지역 기반 추천
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
      if (coords) {
        const result = await locationApi.reverseGeocode(coords);
        setResolved(result);
        return result;
      }
      // GPS 실패/거부 → IP fallback
      const ipResult = await locationApi.fromIp();
      setResolved(ipResult);
      return ipResult;
    } catch (err) {
      setError({ code: 'unavailable', rawMessage: String(err) });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [requestGps]);

  return { resolved, error, isLoading, resolve };
}
