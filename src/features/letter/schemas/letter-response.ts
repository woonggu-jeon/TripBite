import { z } from 'zod';
import { paginatedSchema } from '@/lib/schemas/common';
import { letterSchema } from '@/features/mypage/schemas/mypage';

/**
 * Letter 응답 스키마.
 *
 * letterSchema 자체는 mypage 의 nested 와 동일 — 단일 출처 위해 그쪽 import.
 * 본 파일은 page / detail 응답 형태만 정의.
 */

export const letterPageSchema = paginatedSchema(letterSchema);
export const letterDetailSchema = letterSchema;
