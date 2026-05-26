'use client';

/**
 * <WeatherWidget />
 *
 * 홈 대시보드의 "위치+날씨 기반 오늘의 추천" 위젯.
 *
 * 데이터 흐름:
 *   1) useResolveLocation().resolve()로 위치 확보
 *   2) useCurrentWeather(coords)로 현재 날씨
 *   3) GET /recommendations/today?lat=&lng=&condition= → 추천 여행지 1~3개
 *
 * 성능:
 *   - 날씨는 15분 staleTime (CACHE.weather)
 *   - 추천은 CACHE.normal
 *   - fixed height로 CLS 방지
 */
export function WeatherWidget() {
  return null;
}
