/**
 * Auth 요청/응답 타입
 *
 * 실제로는 openapi-typescript-codegen 의 @/generated/api 타입 re-export 권장.
 * 여기서는 백엔드 스키마 확정 전 fallback 타입.
 */

export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginResponse = {
  // 토큰은 Set-Cookie로 발급되므로 body는 최소 정보만
  success: boolean;
};

export type SignupRequest = {
  name: string;
  username: string;
  password: string;
  birthDate: string; // YYYY-MM-DD
  email: string;
  phone: string;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type ResetPasswordRequest = {
  token: string;
  password: string;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

export type FindIdRequest = {
  name: string;
  email: string;
};

export type FindIdResponse = {
  /** 마스킹된 아이디 (예: "tes***01"). 미존재 시 null */
  username: string | null;
};
