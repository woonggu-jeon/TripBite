import { z } from 'zod';

/**
 * 공통 sub-schema — 여러 endpoint 응답에서 재사용.
 *
 * BE Swagger 도착 후엔 generator 가 동일 형태로 생성하므로 본 파일도 삭제 가능.
 */

// 11 시군 코드. union 으로 묶지 않고 string 유지 — BE 가 대소문자 / 신규 추가 가능성 대비.
export const regionCodeSchema = z.string();

// 4 카테고리. enum 으로 강제 — UI 매핑이 정확히 4개라 mismatch 시 즉시 발견.
export const destinationCategorySchema = z.enum([
  'local',
  'festival',
  'attraction',
  'experience',
]);

// 시즌 4종.
export const seasonSchema = z.enum(['spring', 'summer', 'autumn', 'winter']);

// 좌표.
export const coordsSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

// 기본 Destination shape — 여러 응답에서 nested 됨.
// summary 는 폐기 — description 만 사용 (detail spec 합의 #12, BACKLOG).
export const destinationSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: destinationCategorySchema,
  region: regionCodeSchema,
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  eventStart: z.string().optional(),
  eventEnd: z.string().optional(),
});

// 페이지네이션 응답 (cursor 기반)
export function paginatedSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    nextCursor: z.union([z.number(), z.string(), z.null()]).optional(),
  });
}
