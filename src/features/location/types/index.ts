/**
 * 위치 권한 및 좌표 타입
 *
 * Web Geolocation API 와 1:1 매칭하지 않고
 * 앱 도메인에 맞게 단순화.
 */

export type Coordinates = {
  latitude: number;
  longitude: number;
  /** 위치 정확도 (meter). 낮을수록 정밀. */
  accuracy?: number;
};

export type PermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported';

export type GeolocationErrorCode =
  | 'permission-denied'  // 사용자가 거부
  | 'unavailable'        // 기기/네트워크 문제
  | 'timeout'            // 시간 초과
  | 'unsupported';       // 브라우저 미지원

export type GeolocationError = {
  code: GeolocationErrorCode;
  /** 원본 PositionError.message (디버깅용). UI엔 i18n 메시지를 사용. */
  rawMessage?: string;
};

/** 역지오코딩 결과 (좌표 → 주소) */
export type ResolvedLocation = Coordinates & {
  /** 사용자에게 보여줄 짧은 위치명 (예: "충북 청주시") */
  label: string;
  /** 행정구역 코드 등 (백엔드 매핑용) */
  regionCode?: string;
};
