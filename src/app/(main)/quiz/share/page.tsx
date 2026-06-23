import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { SubHeader } from '@/components/layout/SubHeader';
import { TravelTypeShareCard } from '@/features/ranking/components/TravelTypeShareCard';

/**
 * 여행 유형 공유 카드 페이지 (/quiz/share).
 *
 * SubHeader 표준 패턴 — 자체 header 제거 (Figma "TST · 공유 이미지 카드"
 * 는 카드 자체만 명시, SubHeader 는 다른 페이지 동일).
 *
 * robots noindex — 사용자별 quiz 결과의 공유 카드 미리보기. 공유 링크 색인
 * 시 검색 결과에 타인의 결과 노출 위험 (quiz/result 와 동일 정책).
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('travelType.share');
  return {
    title: t('metaTitle'),
    robots: { index: false, follow: false },
  };
}

export default async function QuizSharePage() {
  const t = await getTranslations('travelType.share');
  return (
    <>
      <SubHeader title={t('heading')} />
      <TravelTypeShareCard />
    </>
  );
}
