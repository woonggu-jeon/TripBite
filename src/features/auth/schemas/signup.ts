import { z } from 'zod';
import { graphemeLength, textGuards } from '@/lib/validation';

/**
 * 회원가입 폼 검증 — 모든 필드 필수
 *
 * 에러 메시지는 i18n 키(auth.signup.errors.*).
 * 보안 검사는 @/lib/validation 공유.
 *
 * 백엔드 추가 검증: 아이디/이메일 중복, 비속어, 비밀번호 강도 등.
 */
const USERNAME = /^[a-zA-Z0-9_]{4,20}$/;
const BIRTH_DATE = /^\d{4}-\d{2}-\d{2}$/;
// 010-1234-5678 / 01012345678 / 010-12345678 등 허용
const PHONE = /^01[016789]-?\d{3,4}-?\d{4}$/;

export const signupSchema = z.object({
  name: z
    .string()
    .transform((s) => s.trim())
    .refine((v) => graphemeLength(v) >= 1, 'nameRequired')
    .refine((v) => graphemeLength(v) <= 30, 'nameTooLong')
    .refine(textGuards.noControl, 'nameInvalid')
    .refine(textGuards.noHtml, 'nameInvalid'),
  username: z.string().regex(USERNAME, 'usernameInvalid'),
  password: z
    .string()
    .min(10, 'passwordMin')
    .max(72, 'passwordMax')
    .refine(textGuards.noControl, 'passwordInvalid'),
  birthDate: z.string().regex(BIRTH_DATE, 'birthDateInvalid'),
  email: z.string().email('emailInvalid'),
  phone: z.string().regex(PHONE, 'phoneInvalid'),
});

export type SignupFormValues = z.infer<typeof signupSchema>;
