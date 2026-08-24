import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AuthHeader } from '@/components/layout/AuthHeader';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { FindIdForm } from '@/features/auth/components/FindIdForm';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth.findId');
  return { title: t('title') };
}

export default function FindIdPage() {
  return (
    <AuthLayout variant="column" header={<AuthHeader />}>
      <FindIdForm />
    </AuthLayout>
  );
}
