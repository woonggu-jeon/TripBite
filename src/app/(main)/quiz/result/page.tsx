import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { SubHeader } from '@/components/layout/SubHeader';
import { TravelTypeResult } from '@/features/ranking/components/TravelTypeResult';

/**
 * 여행 유형 테스트 결과 페이지 (/quiz/result).
 *
 * 데이터 진실은 GET /travel-types/me — submit 직후/새로고침/공유 링크 모두 동일 hook.
 * 결과 없음 시 컴포넌트가 /quiz 로 재이동.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('travelType.result');
  return { title: t('metaTitle') };
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
