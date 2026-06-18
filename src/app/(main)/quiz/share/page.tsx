import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { TravelTypeShareCard } from '@/features/ranking/components/TravelTypeShareCard';

/**
 * 여행 유형 공유 카드 페이지 (/quiz/share).
 *
 * 컴포넌트가 자체 헤더(뒤로/타이틀) 포함 — 별도 SubHeader 미사용.
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

export default function QuizSharePage() {
  return <TravelTypeShareCard />;
}
