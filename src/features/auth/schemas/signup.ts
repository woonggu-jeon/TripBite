import { z } from 'zod';
import { graphemeLength, textGuards } from '@/lib/validation';

/**
 * 회원가입 폼 검증 — BE SignupDto 와 1:1 정합 (4 필수 + 비번 확인).
 *
 *   - username  ^[a-zA-Z0-9]{4,20}$
 *   - password  영문+숫자+특문 포함 10-72자
 *   - nickname  ^[가-힣a-zA-Z0-9]{2,10}$
 *   - email     이메일 형식
 *   - passwordConfirm (FE 단독, BE 로 안 보냄)
 *
 * 에러 메시지는 i18n 키(auth.signup.errors.*).
 * 백엔드 추가 검증: 아이디/이메일 중복(409), 비속어 등.
 */
const USERNAME = /^[a-zA-Z0-9]{4,20}$/;
const NICKNAME = /^[가-힣a-zA-Z0-9]{2,10}$/;
const NAME = /^[가-힣a-zA-Z ]{2,20}$/;
const BIRTHDATE = /^\d{4}-\d{2}-\d{2}$/;
// 영문 1+ AND 숫자 1+ AND 특수문자 1+ AND 길이 10-72
const PASSWORD_STRONG = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z0-9\s]).{10,72}$/;

/** YYYY-MM-DD 가 실제 존재하는 날짜 + 과거(미래 불가) + 1900년 이후 인지. */
function isValidBirthDate(v: string): boolean {
  if (!BIRTHDATE.test(v)) return false;
  const [y, m, day] = v.split('-').map(Number);
  const d = new Date(`${v}T00:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  // Date 가 자동 보정한 경우(예: 02-31) 원본과 불일치 → 거부.
  if (d.getFullYear() !== y || d.getMonth() + 1 !== m || d.getDate() !== day) {
    return false;
  }
  return d <= new Date() && y >= 1900;
}

export const signupSchema = z
  .object({
    username: z.string().regex(USERNAME, 'usernameInvalid'),
    // 신규 Spring BE SignupRequestDto: name·birthDate 필수.
    name: z
      .string()
      .transform((s) => s.trim())
      .refine((v) => NAME.test(v), 'nameInvalid')
      .refine(textGuards.noControl, 'nameInvalid')
      .refine(textGuards.noHtml, 'nameInvalid'),
    birthDate: z.string().refine(isValidBirthDate, 'birthDateInvalid'),
    nickname: z
      .string()
      .transform((s) => s.trim())
      .refine((v) => graphemeLength(v) >= 2, 'nicknameTooShort')
      .refine((v) => graphemeLength(v) <= 10, 'nicknameTooLong')
      .refine((v) => NICKNAME.test(v), 'nicknameInvalid')
      .refine(textGuards.noControl, 'nicknameInvalid')
      .refine(textGuards.noHtml, 'nicknameInvalid'),
    password: z
      .string()
      .min(10, 'passwordMin')
      .max(72, 'passwordMax')
      .regex(PASSWORD_STRONG, 'passwordWeak')
      .refine(textGuards.noControl, 'passwordInvalid'),
    passwordConfirm: z.string(),
    email: z.string().email('emailInvalid'),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.passwordConfirm) {
      ctx.addIssue({
        path: ['passwordConfirm'],
        code: 'custom',
        message: 'passwordMismatch',
      });
    }
  });

export type SignupFormValues = z.infer<typeof signupSchema>;
