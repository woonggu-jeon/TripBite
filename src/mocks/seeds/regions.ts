import { CHUNGBUK_REGIONS } from '@/constants/regions';

/**
 * 시군별 콘텐츠 시드 — 각 11시군 × 3 type × 8 = 264개
 *
 * BE 응답 id 체계 = `tour-<contentid>` (TourAPI). mock 도 deterministic 정수 id
 * 생성 (region/type/idx hash) — cross-reference 가능.
 *
 * 시군당 type 별 8개씩 → limit=10 무한스크롤 검증 가능 (1 페이지로 끝 X).
 */
const TYPES = ['attraction', 'festival', 'experience'] as const;
const PER_TYPE = 8;

function tourContentId(region: string, type: string, idx: number): string {
  const s = `rc-${region}-${type}-${idx}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return `tour-${(Math.abs(h) % 9000000) + 1000000}`;
}

const TYPE_LABEL: Record<(typeof TYPES)[number], string> = {
  attraction: '명소',
  festival: '축제',
  experience: '체험',
};

export const regionContentSeeds = CHUNGBUK_REGIONS.flatMap((r) =>
  TYPES.flatMap((type) =>
    Array.from({ length: PER_TYPE }, (_, i) => {
      const idx = i + 1;
      const id = tourContentId(r.code, type, idx);
      return {
        id,
        contentId: id,
        type,
        region: r.code,
        title: `${r.ko} ${TYPE_LABEL[type]} ${idx}`,
        summary: `${r.ko} 의 ${TYPE_LABEL[type]} ${idx}번째 장소`,
        imageUrl: undefined as string | undefined,
      };
    }),
  ),
);
