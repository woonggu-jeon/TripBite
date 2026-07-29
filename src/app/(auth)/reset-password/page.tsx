import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth.resetPassword');
  return { title: t('title') };
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      {/* useSearchParams 사용 → Suspense 경계 필요 */}
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
