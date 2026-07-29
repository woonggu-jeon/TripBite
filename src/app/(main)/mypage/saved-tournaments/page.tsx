import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SubHeader } from '@/components/layout/SubHeader';
import { SavedTournamentsAll } from './_components/SavedTournamentsAll';

/**
 * 저장한 우승 여행지 — 전체 목록.
 *
 * mypage 의 SavedTournamentsSection 이 최신 3개만 + 전체보기 link.
 * 이 페이지가 전체 + 정렬/필터 정밀 리스트.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('mypage.savedTournaments');
  return { title: t('allTitle') };
}

export default async function SavedTournamentsPage() {
  const t = await getTranslations('mypage.savedTournaments');
  return (
    <>
      <SubHeader title={t('allTitle')} />
      <SavedTournamentsAll />
    </>
  );
}
