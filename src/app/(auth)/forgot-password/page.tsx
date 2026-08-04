import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { AuthHeader } from '@/components/layout/AuthHeader';

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
