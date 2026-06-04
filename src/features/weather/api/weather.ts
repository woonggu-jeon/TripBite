import { api } from '@/services/api/client';
import { safeParseResponse } from '@/lib/safe-parse-response';
import { currentWeatherSchema } from '@/features/weather/schemas/weather';
import type { CurrentWeather } from '@/features/weather/types';
import type { Coordinates } from '@/features/location';

/**
 * Weather API
 *
 * 엔드포인트:
 *   GET /weather/current?lat=&lng=
 *     - 좌표 미지정 시 사용자 거주지(homeRegion) 또는 IP 기반 fallback
 *
 * 클라이언트는 useResolveLocation 으로 얻은 좌표를 그대로 전달.
 */
export const weatherApi = {
  getCurrent: async (coords?: Coordinates): Promise<CurrentWeather> => {
    const res = await api.get<unknown>('/weather/current', {
      params: coords
        ? { lat: coords.latitude, lng: coords.longitude }
        : undefined,
    });
    return safeParseResponse(
      currentWeatherSchema,
      res.data,
      'GET /weather/current',
    ) as CurrentWeather;
  },
};
