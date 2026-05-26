'use client';

import { useQuery } from '@tanstack/react-query';
import { weatherApi } from '@/features/weather/api/weather';
import { CACHE } from '@/lib/cache';
import type { Coordinates } from '@/features/location';

export const weatherKeys = {
  current: (coords?: Coordinates) =>
    [
      'weather',
      'current',
      coords ? `${coords.latitude.toFixed(2)},${coords.longitude.toFixed(2)}` : 'auto',
    ] as const,
};

/**
 * 현재 날씨 — 15분 staleTime
 *
 * 좌표를 인자로 받아 키에 포함 → 좌표 바뀌면 자동 재요청.
 * (소수점 2자리로 trunc — 같은 동네 안 미세 이동은 재요청 X)
 */
export function useCurrentWeather(coords?: Coordinates) {
  return useQuery({
    queryKey: weatherKeys.current(coords),
    queryFn: () => weatherApi.getCurrent(coords),
    ...CACHE.weather,
  });
}
