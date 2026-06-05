'use client';

import { useQuery } from '@tanstack/react-query';
import { useInfiniteList } from '@/features/list';
import { regionApi } from '@/features/region/api/region';
import { CACHE } from '@/lib/cache';
import type { RegionCode } from '@/constants/regions';
import type { RegionContentType } from '@/features/region/types';

export const regionKeys = {
  all: ['region'] as const,
  summary: (code: RegionCode) => [...regionKeys.all, 'summary', code] as const,
  contents: (code: RegionCode, type: RegionContentType) =>
    [...regionKeys.all, 'contents', code, type] as const,
  ongoingFestivals: (code?: RegionCode) =>
    [...regionKeys.all, 'ongoing-festivals', code ?? 'all'] as const,
};

/** 시군 summary — 헤더 이미지, 설명 */
export function useRegionSummary(code: RegionCode) {
  return useQuery({
    queryKey: regionKeys.summary(code),
    queryFn: () => regionApi.getSummary(code),
    ...CACHE.slow, // TourAPI 데이터는 자주 안 바뀜
  });
}

/** 시군 상세 탭 — 관광지/축제/체험 무한 스크롤 */
export function useRegionContents(code: RegionCode, type: RegionContentType) {
  return useInfiniteList({
    queryKey: regionKeys.contents(code, type),
    queryFn: ({ pageParam }) =>
      regionApi.listContents(code, { type, cursor: pageParam, limit: 10 }),
    cache: 'slow',
  });
}

/** 홈 캐러셀용 — 진행 중 충북 축제 */
export function useOngoingFestivals(region?: RegionCode) {
  return useQuery({
    queryKey: regionKeys.ongoingFestivals(region),
    queryFn: () => regionApi.ongoingFestivals(region),
    ...CACHE.slow,
  });
}
