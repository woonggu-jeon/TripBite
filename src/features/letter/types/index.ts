/**
 * 다섯글자 편지 도메인 — FE 자체 union.
 *
 * DTO (Letter/LetterAuthor/LetterPage/ComposeLetter) 는 `@/types/api-domain`
 * 의 generated 형을 사용처에서 직접 import. 본 파일은 FE 전용 union 만 보관.
 */

/** 편지 목록 종류 — 받은 / 보낸 / 좋아요 / 저장 (북마크) */
export type LetterListKind = 'received' | 'sent' | 'liked' | 'saved';
