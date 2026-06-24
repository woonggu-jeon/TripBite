import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SubHeader } from '@/components/layout/SubHeader';
import { TournamentResultClient } from './_components/TournamentResultClient';

/**
 * 토너먼트 결과 페이지 (/tournament/result) — Figma "TRN · 토너먼트 결과" 정합.
 *
 * 구성은 TournamentResultClient 의 docstring 참조 (WinnerCard / WinnerDetailPanel
 * / TournamentStats / LuckyLadder / actions). 새로고침 / 직접 진입 시 store 에
 * winner 없으면 /tournament 로 복귀.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('tournament');
  return {
    title: t('resultTitle'),
    alternates: { canonical: '/tournament/result' },
    // 결과는 store 의존 + ?id= deep-link 도 사용자별 — 색인 제외.
    robots: { index: false, follow: false },
  };
}

export default async function TournamentResultPage() {
  const t = await getTranslations('tournament');
  return (
    <>
      <SubHeader title={t('resultTitle')} />
      <TournamentResultClient />
    </>
  );
}
