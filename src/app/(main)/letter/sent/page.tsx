import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { SubHeader } from '@/components/layout/SubHeader';

/**
 * 보낸 편지 (전송 결과) 페이지 (/letter/sent)
 *
 * 흐름: /letter/compose → 보내기 성공 → router.push('/letter/sent')
 * 입력 내용은 letter-store.lastSent (sessionStorage) 에 보관.
 *
 * 본격 컴포넌트는 다음 단계에서 (또 쓰기 / 홈으로 버튼 + 전송 내용 재첨부).
 * 현재는 typedRoutes 호환 용 placeholder.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('letter');
  return { title: t('sent') };
}

export default async function LetterSentPage() {
  const t = await getTranslations('letter');
  return (
    <>
      <SubHeader title={t('sent')} />
      <div style={{ padding: '2rem 1rem', color: 'var(--color-muted)' }}>
        TODO: 전송 결과 화면 (다음 단계에서 작성)
      </div>
    </>
  );
}
