import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SubHeader } from '@/components/layout/SubHeader';
import { TravelTypeResult } from '@/features/ranking/components/TravelTypeResult';

/**
 * 여행 유형 테스트 결과 페이지 (/quiz/result).
 *
 * 데이터 진실은 GET /travel-types/me — submit 직후/새로고침/공유 링크 모두 동일 hook.
 * 결과 없음 시 컴포넌트가 /quiz 로 재이동.
 *
 * robots noindex — 사용자별 결과 페이지 (개인 quiz 답변에 따라 다른 콘텐츠).
 * 검색 결과에 개인 결과 노출 방지 (tournament/play, tournament/result 와 동일 정책).
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('travelType.result');
  return {
    title: t('metaTitle'),
    robots: { index: false, follow: false },
  };
}

export default async function QuizResultPage() {
  const t = await getTranslations('travelType.result');
  return (
    <>
      <SubHeader title={t('metaTitle')} />
      <TravelTypeResult />
    </>
  );
}
