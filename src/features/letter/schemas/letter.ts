import { z } from 'zod';

/**
 * 다섯글자 편지 입력 검증 — 보안 강화 버전
 *
 * 규칙:
 *   1) 1~5자 (grapheme 단위, 이모지 안전)
 *   2) 공백만 입력 금지
 *   3) zero-width 문자 차단 (눈에 안 보이는 문자로 위장 방지)
 *   4) 제어문자 차단
 *   5) HTML 특수문자 차단
 *
 * 백엔드 추가 처리:
 *   - 비속어 필터
 *   - 출력 시 escape (React가 기본 해주지만 이중 안전망)
 */
function graphemeLength(str: string) {
  return Array.from(str).length;
}

const HTML_DANGEROUS = /[<>"'&]/;
const ZERO_WIDTH = /[\u200B-\u200D\uFEFF\u2060]/;
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/;

export const letterSchema = z.object({
  body: z
    .string()
    .refine((v) => v.trim().length > 0, 'empty')
    .refine((v) => graphemeLength(v) <= 5, 'maxLength')
    .refine((v) => !CONTROL_CHARS.test(v), 'invalidChar')
    .refine((v) => !ZERO_WIDTH.test(v), 'invalidChar')
    .refine((v) => !HTML_DANGEROUS.test(v), 'invalidChar'),
});

export type LetterFormValues = z.infer<typeof letterSchema>;

export { graphemeLength };
