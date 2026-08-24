import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AuthHeader } from '@/components/layout/AuthHeader';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth.forgotPassword');
  return { title: t('title') };
}

export default function ForgotPasswordPage() {
  return (
    <AuthLayout variant="column" header={<AuthHeader />}>
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
