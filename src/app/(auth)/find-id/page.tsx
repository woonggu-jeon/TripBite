import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { FindIdForm } from '@/features/auth/components/FindIdForm';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { AuthHeader } from '@/components/layout/AuthHeader';

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
