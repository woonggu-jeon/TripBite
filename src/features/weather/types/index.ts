/**
 * 날씨 도메인
 *
 * 백엔드 = 기상청/OpenWeatherMap 프록시 (서버에 API 키 보관 + 캐싱).
 * 클라이언트는 좌표만 보내면 됨.
 */

export type WeatherCondition =
  | 'clear'
  | 'cloudy'
  | 'rainy'
  | 'snowy'
  | 'foggy'
  | 'stormy';

export type CurrentWeather = {
  /** 섭씨 */
  temperature: number;
  feelsLike?: number;
  condition: WeatherCondition;
  /** 짧은 한 줄 (예: "맑음, 외출하기 좋아요") */
  summary?: string;
  humidity?: number;
  /** 시·군 라벨 */
  locationLabel?: string;
};
