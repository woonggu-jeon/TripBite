import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SubHeader } from '@/components/layout/SubHeader';
import { RankingPageContent } from './_components/RankingPageContent';

/**
 * 여행지 랭킹 페이지 (/ranking)
 *
 * i18n:
 *   - generateMetadata 로 title 다국어
 *   - SubHeader 에는 t('ranking.title') 전달 (Server Component에서 getTranslations 사용)
 *
 * 섹션 구성: ranking.sections.* 키 참조 (각 섹션 컴포넌트 내부에서 t() 호출)
 *   - weeklyWinners, recommended, byCategory, seasonal,
 *     byTravelType, travelTypeTest
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('ranking');
  return { title: t('title') };
}

export default async function RankingPage() {
  const t = await getTranslations('ranking');
  return (
    <>
      <SubHeader title={t('title')} />
      <RankingPageContent />
    </>
  );
}
