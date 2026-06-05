import { api } from '@/services/api/client';
import type { RegionCode } from '@/constants/regions';
import { normalizeImageField } from '@/lib/secure-image-url';
import type {
  RegionContent,
  RegionContentType,
  RegionSummary,
} from '@/features/region/types';
import type { PageResponse } from '@/features/list';

/**
 * Region (시군) API
 *
 * 백엔드 = TourAPI 프록시 (서버에서 API 키 보관, 응답 정규화, 캐시).
 *
 * 엔드포인트:
 *   GET /regions/:code/summary
 *   GET /regions/:code/contents?type=festival&cursor=...&limit=10
 *   GET /regions/:code/ongoing-festivals    (홈 캐러셀용 — 진행 중인 축제)
 */
export const regionApi = {
  getSummary: async (code: RegionCode): Promise<RegionSummary> => {
    const res = await api.get<RegionSummary>(`/regions/${code}/summary`);
    return res.data;
  },

  listContents: async (
    code: RegionCode,
    params: {
      type: RegionContentType;
      cursor?: string | number | null;
      limit?: number;
    },
  ): Promise<PageResponse<RegionContent>> => {
    const res = await api.get<PageResponse<RegionContent>>(
      `/regions/${code}/contents`,
      { params: { ...params, cursor: params.cursor ?? undefined } },
    );
    // TourAPI 원본 http URL → https 정규화 (BE 가 sync 시점에 변환 안 했을 때 안전망)
    return { ...res.data, items: res.data.items.map(normalizeImageField) };
  },

  ongoingFestivals: async (region?: RegionCode): Promise<RegionContent[]> => {
    const res = await api.get<RegionContent[]>('/regions/ongoing-festivals', {
      params: { region },
    });
    return res.data.map(normalizeImageField);
  },
};
