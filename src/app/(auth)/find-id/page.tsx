import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ComingSoon } from '@/components/feedback/ComingSoon';
import { AuthHeader } from '@/components/layout/AuthHeader';
import { AuthLayout } from '@/components/layout/AuthLayout';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth.findId');
  return { title: t('title') };
}

// 아이디 찾기: Spring 미지원(/auth/find-id 없음) → 준비중.
export default async function FindIdPage() {
  const t = await getTranslations('auth.findId');
  return (
    <AuthLayout variant="column" header={<AuthHeader />}>
      <ComingSoon title={t('title')} />
    </AuthLayout>
  );
}
