import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { TravelTypeShareCard } from '@/features/ranking/components/TravelTypeShareCard';

/**
 * 여행 유형 공유 카드 페이지 (/quiz/share).
 *
 * 컴포넌트가 자체 헤더(뒤로/타이틀) 포함 — 별도 SubHeader 미사용.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('travelType.share');
  return { title: t('metaTitle') };
}

export default function QuizSharePage() {
  return <TravelTypeShareCard />;
}
