import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PageBackground } from '@/components/layout/PageBackground';
import { SubHeader } from '@/components/layout/SubHeader';
import { StampsClient } from './_components/StampsClient';

/**
 * 충북 도장책 — 전체 지도 페이지.
 *
 * 마이페이지의 StampBookBanner 가 "충북 마스터까지 N개 남음" 형태로 진입점만 표시.
 * 이 페이지에서 11 시군 정밀 지도 + 진행률 + 11/11 마스터 공유.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('mypage.stampBook');
  return { title: t('pageTitle') };
}

export default async function StampsPage() {
  const t = await getTranslations('mypage.stampBook');
  return (
    <>
      <PageBackground />
      <SubHeader title={t('pageTitle')} />
      <StampsClient />
    </>
  );
}
