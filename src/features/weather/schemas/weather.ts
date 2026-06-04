import { z } from 'zod';

/**
 * 현재 날씨 응답 스키마.
 */
export const currentWeatherSchema = z.object({
  temperature: z.number(),
  feelsLike: z.number().optional(),
  condition: z.string(),
  summary: z.string().optional(),
  humidity: z.number().optional(),
  locationLabel: z.string().optional(),
});
