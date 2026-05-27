/**
 * 입력 검증 공통 유틸 — 보안 검사 + grapheme 길이 + zod refine 헬퍼
 *
 * 닉네임/편지 등 사용자 입력 schema가 공유.
 * 보안 규칙을 단일 출처로 관리 → 한 곳만 고치면 전체 반영.
 *
 * zero-width/제어문자는 정규식 리터럴 대신 코드포인트 검사로 — 소스에 보이지 않는
 * 문자가 박히는 사고를 방지.
 */

/** grapheme(코드포인트) 단위 길이 — 이모지/한글 안전 (str.length는 surrogate 분리) */
export function graphemeLength(str: string): number {
  return Array.from(str).length;
}

/** HTML 특수문자 — XSS 위장 방지 (백엔드 escape 누락 대비 이중 안전망) */
export const HTML_DANGEROUS = /[<>"'&]/;

/** 닉네임 허용 문자 — 한글/영문/숫자/언더스코어 */
export const NICKNAME_ALLOWED = /^[가-힣a-zA-Z0-9_]+$/;

// zero-width: U+200B~200D(ZWSP/ZWNJ/ZWJ), U+FEFF(BOM), U+2060(WORD JOINER)
const ZERO_WIDTH_CODES = new Set([0x200b, 0x200c, 0x200d, 0xfeff, 0x2060]);

/** 눈에 안 보이는 위장(homograph) 문자 포함 여부 */
export function hasZeroWidth(str: string): boolean {
  for (const ch of str) {
    const code = ch.codePointAt(0);
    if (code !== undefined && ZERO_WIDTH_CODES.has(code)) return true;
  }
  return false;
}

/** 제어문자(U+0000~001F, U+007F) 포함 여부 — 탭/개행/NUL 등 */
export function hasControlChar(str: string): boolean {
  for (const ch of str) {
    const code = ch.codePointAt(0);
    if (code !== undefined && (code <= 0x1f || code === 0x7f)) return true;
  }
  return false;
}

/** zod `.refine`에 그대로 넣는 술어 — true면 통과 */
export const textGuards = {
  noHtml: (v: string) => !HTML_DANGEROUS.test(v),
  noZeroWidth: (v: string) => !hasZeroWidth(v),
  noControl: (v: string) => !hasControlChar(v),
} as const;
