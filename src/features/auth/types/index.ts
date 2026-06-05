/**
 * Auth 요청/응답 타입 — orval 가 BE swagger 로 생성한 DTO 의 alias.
 *
 * 호출처는 `LoginRequest` 같은 도메인 명 그대로 사용, 진실의 원천은 generated DTO.
 * BE swagger 변경 시 자동 반영 (필드명/제약 조건 등).
 *
 * form validation 은 `src/features/auth/schemas/*.ts` 가 별도 zod 정의 — phone
 * regex 등 FE 특화 룰 + react-hook-form 통합 + i18n 에러 키. generated DTO 는
 * payload type 만 담당.
 */
import type {
  ChangePasswordDto,
  FindIdDto,
  FindIdResponseDto,
  ForgotPasswordDto,
  LoginDto,
  LoginResponseDto,
  ResetPasswordDto,
  SignupDto,
} from '@/api/generated/schemas';

export type LoginRequest = LoginDto;
export type LoginResponse = LoginResponseDto;
export type SignupRequest = SignupDto;
export type ForgotPasswordRequest = ForgotPasswordDto;
export type ResetPasswordRequest = ResetPasswordDto;
export type ChangePasswordRequest = ChangePasswordDto;
export type FindIdRequest = FindIdDto;
export type FindIdResponse = FindIdResponseDto;
