import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { SignupForm } from '@/features/auth/components/SignupForm';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { AuthHeader } from '@/components/layout/AuthHeader';

/**
 * 회원가입 (/signup) — 비인증 전용 (middleware).
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth.signup');
  return { title: t('title') };
}

export default async function SignupPage() {
  const t = await getTranslations('auth.signup');
  return (
    <AuthLayout variant="column" header={<AuthHeader title={t('title')} />}>
      <SignupForm />
    </AuthLayout>
  );
}
