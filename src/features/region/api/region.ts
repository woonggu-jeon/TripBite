// 신규 Spring BE 지원: ongoing-festivals. (summary 는 미지원 → RegionHero 가 정적 렌더)
// contents 는 4-A 전환: destinations list(시군 필터)로 재구성.
import { getList2 } from '@/api/be/destination/destination';
import { getOngoingFestivals } from '@/api/be/region/region';
import type { GetList2Category, GetList2Region } from '@/api/be/schemas';
import type { RegionCode } from '@/constants/regions';
import { normalizeImageField } from '@/lib/secure-image-url';
import type { DestinationCategory, RegionContentDto } from '@/types/api-domain';

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
 *   GET /regions/:code/contents?type=&cursor=&limit=10  (4-A: destinations 로 재구성)
 *   GET /regions/ongoing-festivals?region=
 *     → { type: ongoing|upcoming|popular, items[] } — BE 가 3단계 폴백 후 결정.
 * (summary 는 Spring 미지원 → RegionHero 가 정적 콘텐츠로 렌더, 어댑터 없음.)
 */
export const regionApi = {
  // 4-A 전환: regions/:code/contents 미지원 → GET /destinations?region=&category= 재구성.
  // 'all' 은 3 카테고리를 같은 pageNo 로 병렬 조회 후 병합 (BE 통합 응답 근사).
  listContents: async (
    code: RegionCode,
    params: {
      type: RegionContentFilter;
      cursor?: string | number | null;
      limit?: number;
    },
  ): Promise<{ items: RegionContentDto[]; nextCursor: number | null }> => {
    const region = code as GetList2Region;
    const numOfRows = params.limit ?? 10;
    const pageNo = params.cursor != null ? Number(params.cursor) : 1;
    const categories: DestinationCategory[] =
      params.type === 'all'
        ? ['attraction', 'festival', 'experience']
        : [params.type];

    const pages = await Promise.all(
      categories.map((category) =>
        getList2({
          category: category as GetList2Category,
          region,
          pageNo,
          numOfRows,
        }),
      ),
    );

    const items: RegionContentDto[] = pages.flatMap((res, i) =>
      (res.data?.items ?? []).map(
        (d) =>
          ({
            type: (d.category ?? categories[i]) as DestinationCategory,
            region: (d.region ?? code) as RegionCode,
            id: String(d.id),
            title: d.name ?? '',
            imageUrl: d.imageUrl ?? undefined,
          }) as RegionContentDto,
      ),
    );

    // 다음 페이지 존재 — 어느 한 카테고리라도 페이지가 꽉 찼으면 더 있음.
    const hasMore = pages.some(
      (res) => (res.data?.items?.length ?? 0) >= numOfRows,
    );

    // TourAPI 원본 http URL → https 정규화 (BE 안전망)
    return {
      items: items.map(normalizeImageField) as RegionContentDto[],
      nextCursor: hasMore ? pageNo + 1 : null,
    };
  },

  // 신규 Spring BE: GET /regions/ongoing-festivals — region 필터 없음(충북 전체).
  // 응답은 ApiResponse<OngoingFestivalsDto> 엔벨로프 → .data unwrap.
  // region 인자는 호환 위해 유지하나 새 BE 는 무시 (전체 반환 후 client 미필터).
  ongoingFestivals: async (_region?: RegionCode) => {
    const res = await getOngoingFestivals();
    const data = res.data;
    // imageUrl 의 http → https 정규화 (BE 안전망). type / daysToStart 등은 그대로.
    return {
      type: data?.type,
      items: (data?.items ?? []).map((item) => normalizeImageField(item)),
    };
  },
};
