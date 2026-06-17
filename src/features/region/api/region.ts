import {
  regionControllerContentsV1,
  regionControllerOngoingFestivalsV1,
  regionControllerSummaryV1,
} from '@/api/generated/regions/regions';
import type { RegionCode } from '@/constants/regions';
import { normalizeImageField, secureImageUrl } from '@/lib/secure-image-url';
import type {
  DestinationCategory,
  RegionContentDto,
} from '@/api/generated/schemas';

/**
 * 시군 contents 필터 — 응답 enum (`DestinationCategory`) 과 분리.
 *
 * 'all' 은 카테고리가 아니라 "필터 없음" 쿼리값. 응답 item 의 type 은 절대
 * 'all' 이 안 되므로 `DestinationCategory` 에 섞으면 enum 오염. BE 응답 enum 은
 * 3값 유지하고, FE 의 query 시점에만 별도 union 으로 'all' 노출.
 *
 * BE region.service: `type` 이 attraction|festival|experience 가 아니면 필터를
 * 안 걸어 전체 반환. FE 는 'all' 시 type 을 omit (undefined) 으로 BE 에 전달 —
 * BE 가 'all' 키워드를 명시 처리하지 않더라도 동일 결과 보장.
 *
 * BE OpenAPI 후속: `@ApiQuery({ enum: ['all', ...DestinationCategory] })` 로
 * query-level enum 만 분리하면 FE 가 명시적으로 `type=all` 전달 가능 (현재는
 * omit 으로 우회). 응답 enum 무변경 → 마이그레이션 0.
 */
export type RegionContentFilter = DestinationCategory | 'all';

/**
 * Region (시군) API — orval 가 BE swagger 로 자동 생성한 client functions wrap.
 *
 * BE 는 TourAPI 프록시 (서버에서 API 키 보관, 응답 정규화, 캐시).
 *
 * 엔드포인트:
 *   GET /regions/:code/summary
 *   GET /regions/:code/contents?type=&cursor=&limit=10
 *   GET /regions/ongoing-festivals?region=
 *     → { type: ongoing|upcoming|popular, items[] } — BE 가 3단계 폴백 후 결정.
 */
export const regionApi = {
  // heroImage 는 TourAPI 원본 http URL 일 수 있음 → next.config remotePatterns
  // (https 만 허용) 통과 위해 https 정규화 (BE 안전망). secure-image-url 의
  // HTTPS_FORCE_HOSTS 에 tong.visitkorea.or.kr 등록돼 자동 처리.
  getSummary: async (code: RegionCode) => {
    const res = await regionControllerSummaryV1(code);
    return res.heroImage
      ? { ...res, heroImage: secureImageUrl(res.heroImage) }
      : res;
  },

  listContents: async (
    code: RegionCode,
    params: {
      type: RegionContentFilter;
      cursor?: string | number | null;
      limit?: number;
    },
  ) => {
    const res = await regionControllerContentsV1(code, {
      // 'all' 은 BE 에 type 미전달 (전체 반환 분기). BE 가 OpenAPI query enum 에
      // 'all' 추가하면 그때 params.type 으로 명시 전달 가능.
      type: params.type === 'all' ? undefined : params.type,
      cursor: params.cursor != null ? String(params.cursor) : undefined,
      limit: params.limit != null ? String(params.limit) : undefined,
    });
    // TourAPI 원본 http URL → https 정규화 (BE 안전망)
    return {
      ...res,
      items: res.items.map(normalizeImageField) as RegionContentDto[],
    };
  },

  ongoingFestivals: async (region?: RegionCode) => {
    const res = await regionControllerOngoingFestivalsV1({ region });
    // imageUrl 의 http → https 정규화 (BE 안전망). type / daysToStart 등은 그대로.
    return {
      type: res.type,
      items: res.items.map((item) => normalizeImageField(item)),
    };
  },
};
