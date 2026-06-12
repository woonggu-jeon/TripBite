import {
  regionControllerContentsV1,
  regionControllerOngoingFestivalsV1,
  regionControllerSummaryV1,
} from '@/api/generated/regions/regions';
import type { RegionCode } from '@/constants/regions';
import { normalizeImageField } from '@/lib/secure-image-url';
import type {
  DestinationCategory,
  RegionContentDto,
} from '@/api/generated/schemas';

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
  getSummary: (code: RegionCode) => regionControllerSummaryV1(code),

  listContents: async (
    code: RegionCode,
    params: {
      type: DestinationCategory;
      cursor?: string | number | null;
      limit?: number;
    },
  ) => {
    const res = await regionControllerContentsV1(code, {
      type: params.type,
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
