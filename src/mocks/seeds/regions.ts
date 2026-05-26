import { CHUNGBUK_REGIONS } from '@/constants/regions';

/**
 * 시군별 콘텐츠 시드 — 각 11시군 × 5개씩 = 55개
 *
 * 디자인 검토 + E2E 테스트 양쪽에 사용.
 * 백엔드 API 가 준비되면 자연스럽게 교체.
 */
export const regionContentSeeds = CHUNGBUK_REGIONS.flatMap((r) =>
  Array.from({ length: 5 }, (_, i) => ({
    id: `${r.code}-${i + 1}`,
    contentId: `tour-${r.code}-${i + 1}`,
    type: (['attraction', 'festival', 'experience'] as const)[i % 3],
    region: r.code,
    title: `${r.ko} 명소 ${i + 1}`,
    summary: `${r.ko} 의 아름다운 ${i + 1}번째 장소`,
    imageUrl: undefined as string | undefined,
  })),
);
