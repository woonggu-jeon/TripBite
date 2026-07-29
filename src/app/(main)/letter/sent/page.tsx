import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SubHeader } from '@/components/layout/SubHeader';
import { LetterSentClient } from './_components/LetterSentClient';

/**
 * 보낸 편지 (전송 결과) 페이지 (/letter/sent)
 *
 * 흐름:
 *   /letter/compose → 보내기 성공 → router.push('/letter/sent')
 *   - lastSent 는 letter-store (sessionStorage)
 *   - lastSent 없으면 안내 + /letter/compose 진입
 *
 * 구성:
 *   1) 상단 알림 (전송 완료)
 *   2) 편지 카드 (From / Message / To)
 *   3) 또 쓰기 / 홈으로
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('letter.sent');
  return { title: t('title') };
}

export default async function LetterSentPage() {
  const t = await getTranslations('letter.sent');
  return (
    <>
      <SubHeader title={t('title')} />
      <LetterSentClient />
    </>
  );
}
