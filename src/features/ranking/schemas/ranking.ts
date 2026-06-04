import { z } from 'zod';
import { destinationSchema } from '@/lib/schemas/common';
import { travelTypeSchema } from '@/features/mypage/schemas/mypage';

/**
 * Ranking / TravelType 응답 스키마.
 */

export const rankedDestinationSchema = z.object({
  rank: z.number(),
  destination: destinationSchema,
  score: z.number(),
});

export const rankingListSchema = z.array(rankedDestinationSchema);

// /travel-types/me — 사용자 적용 유형. 미적용 시 null.
export const myTravelTypeSchema = travelTypeSchema.nullable();
