import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SubHeader } from '@/components/layout/SubHeader';
import { TournamentPlayClient } from './_components/TournamentPlayClient';

/**
 * 토너먼트 진행 페이지 (/tournament/play) — 2026-06-24 refactor 후 매치 진행만.
 *
 * intro/map/tournamentSize phase 는 /tournament (TournamentSetup) 으로 이동
 * (사용자 명시 UX 흐름). 이 페이지의 phase:
 *   1) bracket      : useTournamentCandidates(config) → fetched → Bracket 매치
 *   2) celebration  : 우승자 1.8s 강조 → record mutation → /result 자동 이동
 *
 * 진입 가드: config.tournamentSize / selectedRegions 없으면 /tournament 로 replace.
 * 자세한 흐름은 TournamentPlayClient docstring 참조.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('tournament');
  return {
    title: t('inProgressTitle'),
    alternates: { canonical: '/tournament/play' },
    // 진행 화면은 store 상태 의존 — 공유 가치 없음, 색인 제외.
    robots: { index: false, follow: false },
  };
}

export default async function TournamentPlayPage() {
  const t = await getTranslations('tournament');
  return (
    <>
      <SubHeader title={t('title')} />
      <TournamentPlayClient />
    </>
  );
}
