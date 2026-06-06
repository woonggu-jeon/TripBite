/**
 * 다섯글자 편지 도메인 — orval generated DTO alias.
 */
import type {
  ComposeLetterDto,
  LetterAuthorDto,
  LetterDto,
  LetterPageDto,
} from '@/api/generated/schemas';

export type LetterAuthor = LetterAuthorDto;
export type Letter = LetterDto;
export type LetterPage = LetterPageDto;
export type SendLetterRequest = ComposeLetterDto;

/** 편지 목록 종류 — 받은 / 보낸 / 좋아요 / 저장 (북마크) */
export type LetterListKind = 'received' | 'sent' | 'liked' | 'saved';
