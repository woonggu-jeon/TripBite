import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PageBackground } from '@/components/layout/PageBackground';
import { SubHeader } from '@/components/layout/SubHeader';
import { RankingPageContent } from './_components/RankingPageContent';

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
  return (
    <>
      <PageBackground />
      <SubHeader title={t('title')} />
      <RankingPageContent />
    </>
  );
}
