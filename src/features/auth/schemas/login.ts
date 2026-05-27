import { z } from 'zod';

/**
 * 로그인 폼 — 아이디 기반
 *
 * 식별자는 username(아이디). 로그인 시엔 존재 여부만 확인(형식 강제는 회원가입에서).
 * 에러 메시지는 i18n 키(auth.login.*).
 */
export const loginSchema = z.object({
  username: z.string().min(1, 'usernameRequired'),
  password: z.string().min(1, 'passwordRequired'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
