import { z } from 'zod';
import {
  coordsSchema,
  destinationSchema,
  seasonSchema,
} from '@/lib/schemas/common';

/**
 * Destination 상세 응답.
 *
 * destinationSchema (기본) 위에 description/rating/contact 등 부가 정보 더해진 형태.
 */
export const destinationDetailSchema = destinationSchema.extend({
  photos: z.array(z.string()).optional(),
  rating: z
    .object({
      value: z.number(),
      count: z.number(),
    })
    .optional(),
  tags: z.array(z.string()).optional(),
  address: z.string().optional(),
  hours: z.string().optional(),
  entryFee: z.string().optional(),
  contact: z.string().optional(),
  website: z.string().optional(),
  bestSeasons: z.array(seasonSchema).optional(),
  coords: coordsSchema.optional(),
});
