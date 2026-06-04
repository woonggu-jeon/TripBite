import { z } from 'zod';
import { destinationSchema, regionCodeSchema } from '@/lib/schemas/common';

/**
 * MyPageSummary / Stamps / Profile 응답 스키마.
 *
 * 본 스키마는 BE 합의 전 임시 — Spring Boot Swagger 도착 시 orval 생성 schema 로 교체.
 */

export const myProfileSchema = z.object({
  nickname: z.string(),
  isDefault: z.boolean().optional(),
});

export const savedTournamentSchema = z.object({
  id: z.string(),
  destination: destinationSchema,
  luckyColor: z.string(),
  meetChance: z.number(),
  savedAt: z.string(),
});

export const letterAuthorSchema = z.object({
  nickname: z.string(),
  location: z.string().optional(),
});

export const letterSchema = z.object({
  id: z.string(),
  body: z.string(),
  author: letterAuthorSchema,
  arrivedAt: z.string(),
  createdAt: z.string(),
  isMine: z.boolean(),
  liked: z.boolean(),
  saved: z.boolean(),
  likeCount: z.number().optional(),
  read: z.boolean().optional(),
});

// 본 스키마는 TravelType TS 타입 (description/keywords/emoji 모두 required) 과 정합.
// BE 가 일부 필드 누락할 가능성 대비해 default 값 — safeParse 가 missing 시 빈 값으로 보강.
export const travelTypeSchema = z.object({
  code: z.string(),
  title: z.string(),
  emoji: z.string().default(''),
  description: z.string().default(''),
  keywords: z.array(z.string()).default([]),
  recommended: z.array(destinationSchema).default([]),
});

export const myPageSummarySchema = z.object({
  profile: myProfileSchema,
  savedTournaments: z.array(savedTournamentSchema),
  savedLetters: z.array(letterSchema),
  likedLetters: z.array(letterSchema),
  travelType: travelTypeSchema.nullable(),
});

export const stampsResponseSchema = z.object({
  visited: z.array(regionCodeSchema),
  total: z.number(),
});
