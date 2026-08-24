import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { HomeDashboard } from './_components/HomeDashboard';

/**
 * 홈 페이지 (/) — 대시보드형태
 *
 * 위젯은 features/* 내부 컴포넌트로 분리 (각자 useTranslations 사용).
 * 추천 위젯 6가지는 HomeDashboard 주석 참고.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('home');
  return { title: t('title') };
}

export default async function HomePage() {
  return <HomeDashboard />;
}
