import { z } from 'zod';

/**
 * 닉네임 Zod 스키마 — 보안 강화 패턴
 *
 * 검증 항목:
 *   1) 길이 1~10자 (grapheme 단위, 이모지 포함 안전)
 *   2) 허용 문자: 한글 / 영문 / 숫자 / 언더스코어
 *   3) zero-width 문자 차단 — 닉네임 위장(homograph) 공격 방지
 *   4) 양옆 공백/제어문자 차단
 *   5) HTML 특수문자 (<, >, ", ', &) 차단 — 백엔드가 escape 안 해도 안전
 *
 * 백엔드 측 추가 검증:
 *   - 비속어 사전
 *   - 중복 닉네임 정책
 *
 * 에러 메시지는 i18n 키만 반환 (onboarding.nickname.errors.*)
 */
function graphemeLength(str: string) {
  return Array.from(str).length;
}

const HTML_DANGEROUS = /[<>"'&]/;
const ZERO_WIDTH = /[\u200B-\u200D\uFEFF\u2060]/;
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/;
const ALLOWED_PATTERN = /^[가-힣a-zA-Z0-9_]+$/;

export const nicknameSchema = z.object({
  nickname: z
    .string()
    .transform((s) => s.trim())
    .refine((v) => graphemeLength(v) >= 1, 'tooShort')
    .refine((v) => graphemeLength(v) <= 10, 'tooLong')
    .refine((v) => !CONTROL_CHARS.test(v), 'controlChar')
    .refine((v) => !ZERO_WIDTH.test(v), 'invisibleChar')
    .refine((v) => !HTML_DANGEROUS.test(v), 'invalidChars')
    .refine((v) => ALLOWED_PATTERN.test(v), 'invalidChars'),
});

export type NicknameFormValues = z.infer<typeof nicknameSchema>;
