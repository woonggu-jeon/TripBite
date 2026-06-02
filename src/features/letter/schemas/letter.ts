import { z } from 'zod';
import { graphemeLength, textGuards } from '@/lib/validation';

/**
 * 다섯글자 편지 입력 검증 — 보안 강화 버전
 *
 * 규칙:
 *   1) 1~5자 (grapheme 단위, 이모지 안전)
 *   2) 공백만 입력 금지
 *   3) zero-width / 제어문자 / HTML 특수문자 차단
 *
 * 보안 규칙은 @/lib/validation 단일 출처. 에러 메시지는 i18n 키.
 */
export const letterSchema = z.object({
  body: z
    .string()
    .refine((v) => v.trim().length > 0, 'empty')
    .refine((v) => graphemeLength(v) <= 5, 'maxLength')
    .refine(textGuards.noControl, 'invalidChar')
    .refine(textGuards.noZeroWidth, 'invalidChar')
    .refine(textGuards.noHtml, 'invalidChar'),
});

export type LetterFormValues = z.infer<typeof letterSchema>;
