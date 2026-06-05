import { z } from 'zod';

/**
 * User 응답 zod 스키마 — `/me` 등의 런타임 검증.
 *
 * 왜 zod로 검증?
 *   - codegen 타입은 컴파일 타임만. 백엔드가 실제로 누락/추가 필드를 보내면 감지 불가.
 *   - 인증 핵심 데이터(/me)는 잘못된 형태면 즉시 실패하는 게 안전.
 *   - over-engineering 회피: 인증 핵심에만 적용, 나머지는 codegen 타입 신뢰.
 *
 * 백엔드 OpenAPI 스펙 확정 후엔 generated 타입 + `z.infer<typeof userSchema>` 정합 점검 가능.
 */
export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  nickname: z.string(),
  isOnboarded: z.boolean(),
  homeRegion: z.string(),
  avatarUrl: z.string().nullable(),
  travelType: z
    .object({
      code: z.string(),
      title: z.string(),
      emoji: z.string(),
    })
    .nullable(),
});

export type UserDTO = z.infer<typeof userSchema>;
