import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from '@tanstack/react-query';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PageBackground } from '@/components/layout/PageBackground';
import { SubHeader } from '@/components/layout/SubHeader';
import { rankingApi } from '@/features/ranking/api/ranking';
import { CACHE } from '@/lib/cache';
import { RankingPageContent } from './_components/RankingPageContent';

// queryKey 는 use-ranking 의 rankingKeys.list(params) 와 정합해야 함(하이드레이션
// 매칭). rankingKeys 는 'use client' 훅 모듈 export 라 서버 컴포넌트에서 직접 호출 시
// 클라 참조 프록시가 되어 깨진다 → 여기선 동일 shape 로 인라인. (불일치 시 클라가
// 재요청할 뿐 무해 — graceful.)
const rankingListKey = (params: Record<string, unknown>) =>
  ['ranking', 'list', params] as const;

/**
 * 여행지 랭킹 페이지 (/ranking)
 *
 * i18n:
 *   - generateMetadata 로 title 다국어
 *   - SubHeader 에는 t('ranking.title') 전달 (Server Component에서 getTranslations 사용)
 *
 * 섹션 구성 (RankingPageContent 가 실제 렌더하는 2개):
 *   1) weeklyWinners — 이번주 우승 Top 5 (GET /tournaments/rankings/weekly)
 *   2) byRegionChart — 시군별 우승 횟수 차트 (GET /tournaments/rankings/regions)
 * (recommended/byCategory/seasonal 등 구 mock 섹션은 Spring 미지원으로 미노출 —
 *  BE_SPRING_MIGRATION.md §5 P2-1 참조.)
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('ranking');
  return { title: t('title') };
}

export default async function RankingPage() {
  const t = await getTranslations('ranking');

  // RSC 프리페치 — 공개 데이터(랭킹)를 서버에서 미리 받아 dehydrate → 클라가
  // 하이드레이션 시 캐시에서 즉시 사용(별도 fetch 왕복 제거). 실패해도 shell 은
  // 렌더되고 클라 useRanking 이 재시도(graceful). key/staleTime 은 훅과 정합.
  //
  // mock 모드 skip — MSW 는 브라우저 전용이라 서버 프리페치가 우회(실/부재 BE 로
  // mismatch). 이 경우 프리페치 없이 클라 MSW 가 처리(기존 동작).
  const qc = new QueryClient();
  if (process.env.NEXT_PUBLIC_USE_MSW !== 'true') {
    await Promise.all([
      qc.prefetchQuery({
        queryKey: rankingListKey({ type: 'weekly-winners', limit: 5 }),
        queryFn: () => rankingApi.list({ type: 'weekly-winners', limit: 5 }),
        staleTime: CACHE.normal.staleTime,
      }),
      qc.prefetchQuery({
        queryKey: rankingListKey({ type: 'by-region' }),
        queryFn: () => rankingApi.list({ type: 'by-region' }),
        staleTime: CACHE.normal.staleTime,
      }),
    ]).catch(() => {});
  }

  return (
    <>
      <PageBackground />
      <SubHeader title={t('title')} />
      <HydrationBoundary state={dehydrate(qc)}>
        <RankingPageContent />
      </HydrationBoundary>
    </>
  );
}
