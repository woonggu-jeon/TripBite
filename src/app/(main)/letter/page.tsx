import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { SubHeader } from '@/components/layout/SubHeader';
import { LetterIndex } from './_components/LetterIndex';

/**
 * 다섯글자 편지 페이지 (/letter)
 *
 * 화면 구성: CTA + 도착한 편지 + 보낸 편지
 * i18n 키: letter.title, letter.indexCta.*, letter.received, letter.sent
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('letter');
  return { title: t('title') };
}

export default async function LetterPage() {
  const t = await getTranslations('letter');
  return (
    <>
      <SubHeader title={t('title')} />
      <LetterIndex />
    </>
  );
}
