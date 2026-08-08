import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ComingSoon } from '@/components/feedback/ComingSoon';
import { AuthLayout } from '@/components/layout/AuthLayout';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth.resetPassword');
  return { title: t('title') };
}

// 비밀번호 재설정: Spring 미지원(/auth/reset-password 없음) → 준비중.
export default async function ResetPasswordPage() {
  const t = await getTranslations('auth.resetPassword');
  return (
    <AuthLayout>
      <ComingSoon title={t('title')} />
    </AuthLayout>
  );
}
