import { z } from 'zod';

/**
 * 비밀번호 찾기/재설정
 *
 * - forgot: 이메일 입력 → 백엔드가 재설정 링크 메일 발송
 * - reset: 메일 링크의 토큰 + 새 비밀번호(10자+)
 *
 * 에러 메시지는 i18n 키(auth.forgotPassword.* / auth.resetPassword.*).
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email('emailInvalid'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(10, 'passwordMin').max(72, 'passwordMax'),
});

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
