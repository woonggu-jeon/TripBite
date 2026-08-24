import { z } from 'zod';
import { NICKNAME_ALLOWED, graphemeLength, textGuards } from '@/lib/validation';

/**
 * 닉네임 Zod 스키마 — 보안 강화 패턴
 *
 * 검증:
 *   1) 길이 1~10자 (grapheme 단위)
 *   2) 허용 문자: 한글/영문/숫자/언더스코어
 *   3) zero-width / 제어문자 / HTML 특수문자 차단 (homograph 위장 방지)
 *
 * 보안 규칙은 @/lib/validation 단일 출처. 에러 메시지는 i18n 키(onboarding.nickname.errors.*).
 */
export const nicknameSchema = z.object({
  nickname: z
    .string()
    .transform((s) => s.trim())
    .refine((v) => graphemeLength(v) >= 1, 'tooShort')
    .refine((v) => graphemeLength(v) <= 10, 'tooLong')
    .refine(textGuards.noControl, 'controlChar')
    .refine(textGuards.noZeroWidth, 'invisibleChar')
    .refine(textGuards.noHtml, 'invalidChars')
    .refine((v) => NICKNAME_ALLOWED.test(v), 'invalidChars'),
});

export type NicknameFormValues = z.infer<typeof nicknameSchema>;
