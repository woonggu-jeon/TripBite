import { z } from 'zod';

/**
 * 로그인 폼 Zod 스키마
 *
 * i18n 패턴:
 *   - 에러 메시지에 실제 문자열이 아닌 **i18n 키** 를 넣는다.
 *   - 컴포넌트에서 t(errors.field.message) 로 변환.
 *   - 이렇게 하면 스키마는 locale에 독립적 — 어디서 호출하든 동일.
 *
 * 키는 src/i18n/messages/*.json 의 auth.login.* 와 매칭.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'emailRequired')
    .email('emailInvalid'),
  password: z
    .string()
    .min(8, 'passwordMin')
    .max(72, 'passwordMax'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
