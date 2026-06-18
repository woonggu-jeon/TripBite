import { z } from 'zod';

/**
 * 비밀번호 찾기/재설정
 *
 * - forgot: 이메일 입력 → 백엔드가 재설정 링크 메일 발송
 * - reset: 메일 링크의 토큰 + 새 비밀번호(10자+)
 *
 * 에러 메시지는 i18n 키(auth.forgotPassword.* / auth.resetPassword.*).
 */
// FE 폼은 username + email 둘 다 검증. BE 가 ForgotPasswordDto 에 username 추가
// 전엔 mutation 호출 시 email 만 전달 (BE 갱신 후 둘 다 전송으로 변경).
export const forgotPasswordSchema = z.object({
  username: z.string().regex(/^[a-zA-Z0-9]{4,20}$/, 'usernameInvalid'),
  email: z.string().email('emailInvalid'),
});

/**
 * 재설정 — token + 새 비번 + 확인 일치.
 * BE 는 `{ token, password }` 만 받음 — confirmPassword 는 FE 검증용 (전송 X).
 */
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(10, 'passwordMin').max(72, 'passwordMax'),
    confirmPassword: z.string().min(1, 'confirmRequired'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'mismatch',
    path: ['confirmPassword'],
  });

/**
 * 비밀번호 변경 (로그인 상태) — 현재 비번 확인 + 새 비번(10자+) + 확인 일치
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'currentRequired'),
    newPassword: z.string().min(10, 'passwordMin').max(72, 'passwordMax'),
    confirmPassword: z.string().min(1, 'confirmRequired'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'mismatch',
    path: ['confirmPassword'],
  });

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
