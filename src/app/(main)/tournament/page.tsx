import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { SubHeader } from '@/components/layout/SubHeader';
import { TournamentSetup } from './_components/TournamentSetup';

/**
 * 토너먼트 시작 페이지 (/tournament)
 *
 * 흐름: /tournament → /tournament/play → /tournament/result
 * 단계 간 상태: useTournamentStore (Zustand)
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('tournament');
  return { title: t('title') };
}

export default async function TournamentPage() {
  const t = await getTranslations('tournament');
  return (
    <>
      <SubHeader title={t('title')} />
      <TournamentSetup />
    </>
  );
}
