/**
 * Auth 관련 요청/응답 타입
 *
 * 실제로는 openapi-typescript-codegen 으로 자동 생성된
 * @/generated/api 의 타입을 re-export 하는 것을 권장.
 *
 * 여기서는 백엔드 스키마가 아직 없을 때를 위한 fallback 타입.
 */

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  // 토큰은 서버가 Set-Cookie로 내려주므로 body는 비어있거나
  // 최소한의 정보만 포함될 수 있음
  success: boolean;
};
