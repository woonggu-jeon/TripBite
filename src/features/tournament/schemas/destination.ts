import { z } from 'zod';
import {
  coordsSchema,
  destinationSchema,
  seasonSchema,
} from '@/lib/schemas/common';

/**
 * Destination 상세 응답 — `GET /v1/destinations/:id` 의 합의 spec.
 *
 * 기본 Destination (id, name, category, region, imageUrl, description) +
 * 아래 부가 정보. BE 가 TourAPI 등 외부 + 큐레이션 DB 결합해 채움.
 *
 * 모든 부가 필드는 optional — BE 가 점진적으로 채워도 UI 가 깨지지 않음.
 * field 명은 type DestinationDetail 과 1:1 일치 (UI 가 사용하는 이름과 동일).
 *
 * 합의:
 *   - long form 명 사용 (openingHours / admissionFee / phone) — 의미 명확
 *   - safeParse 가 strip 모드라 schema 정의 안 된 field 는 응답에서 제거됨
 *     → schema 와 type 필드 명을 반드시 동기화 (drift 시 UI 가 undefined 읽음)
 */
export const destinationDetailSchema = destinationSchema.extend({
  // 대표 사진은 base Destination.imageUrl 이 담당 — hero / 공유 카드 / 카드 thumbnail 공용.
  // photos[] 는 추가 갤러리 (예: 시설 내부 / 음식 / 풍경) — 없어도 imageUrl 만으로 동작.
  /** 추가 갤러리 사진 URL 들 (선택) — 있으면 hero 옆에 carousel */
  photos: z.array(z.string()).optional(),
  /** 평점 (0~5) + 후기 수 */
  rating: z
    .object({
      value: z.number(),
      count: z.number(),
    })
    .optional(),
  /** 태그 (예: '#포토존', '#가족') */
  tags: z.array(z.string()).optional(),
  /** 주소 (자유 문자열, BE 가 i18n/포맷 책임) */
  address: z.string().optional(),
  /** 운영시간 (자유 문자열, 줄바꿈 가능) */
  openingHours: z.string().optional(),
  /** 휴무일 (예: '매주 월요일', '설/추석 당일') */
  closedDays: z.string().optional(),
  /** 입장료 / 가격 안내 (자유 문자열, '무료' 도 valid value) */
  admissionFee: z.string().optional(),
  /** 주차 가능 여부 — 미지정(undefined) 은 '정보 없음' 으로 UI 처리 */
  parkingAvailable: z.boolean().optional(),
  /** 대표 전화 (형식 자유) */
  phone: z.string().optional(),
  /** 공식 웹사이트 URL */
  website: z.string().optional(),
  /** 추천 계절 (Season 코드 배열) */
  bestSeasons: z.array(seasonSchema).optional(),
  /** 지도 표시용 좌표 */
  coords: coordsSchema.optional(),
});
