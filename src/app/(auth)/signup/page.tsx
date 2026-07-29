import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { SignupForm } from '@/features/auth/components/SignupForm';

/**
 * 회원가입 (/signup) — 비인증 전용 (middleware).
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth.signup');
  return { title: t('title') };
}

export default function SignupPage() {
  return (
    <AuthLayout>
      <SignupForm />
    </AuthLayout>
  );
}
