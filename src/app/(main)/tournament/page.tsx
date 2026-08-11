import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PageBackground } from '@/components/layout/PageBackground';
import { TournamentSetup } from './_components/TournamentSetup';

/**
 * 토너먼트 시작 페이지 (/tournament)
 *
 * 흐름: /tournament → /tournament/play → /tournament/result
 * 단계 간 상태: useTournamentStore (Zustand)
 *
 * SubHeader 는 wizard step 의 step-- 분기 처리 위해 TournamentSetup 내부에서 렌더링.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('tournament');
  return { title: t('title') };
}

export default function TournamentPage() {
  return (
    <>
      <PageBackground />
      <TournamentSetup />
    </>
  );
}
