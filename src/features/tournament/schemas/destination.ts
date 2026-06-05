import { z } from 'zod';
import { coordsSchema, destinationSchema } from '@/lib/schemas/common';

/**
 * Destination 상세 응답 — `GET /v1/destinations/:id` 의 합의 spec.
 *
 * BE 실제 구현 (docs/API_CONTRACT.md):
 *   기본 (id, name, category, region, description?, imageUrl?) +
 *   summary(필수, ≤120자) / address? / coords? / phone? / website? /
 *   openingHours? / restDate? / parking? / photos: string[]
 *
 * TourAPI 원본 명칭 그대로 — `restDate` (휴무일), `parking` (주차 자유 문자열).
 * `admissionFee` / `tags` / `rating` / `bestSeasons` 는 BE 가 제공하지 않음.
 *
 * safeParse 가 strip 모드라 schema 와 type field 명을 반드시 동기화.
 */
export const destinationDetailSchema = destinationSchema.extend({
  /** 한 줄 요약 (≤120자) — BE 가 항상 채워서 보냄 (overview 또는 fallback) */
  summary: z.string().optional(),
  /** 갤러리 사진 URL 들 — TourAPI detailImage2 */
  photos: z.array(z.string()).optional(),
  /** 주소 (자유 문자열) */
  address: z.string().optional(),
  /** 운영시간 (자유 문자열) */
  openingHours: z.string().optional(),
  /** 휴무일 — TourAPI restdate 원본 (예: '매주 월요일', '설/추석 당일') */
  restDate: z.string().optional(),
  /** 주차 — TourAPI parking 원본 자유 문자열 (예: '가능', '불가', '유료') */
  parking: z.string().optional(),
  /** 대표 전화 (형식 자유) */
  phone: z.string().optional(),
  /** 공식 웹사이트 URL */
  website: z.string().optional(),
  /** 지도 표시용 좌표 */
  coords: coordsSchema.optional(),
});
