import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { FindIdForm } from '@/features/auth/components/FindIdForm';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth.findId');
  return { title: t('title') };
}

export default function FindIdPage() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
      }}
    >
      <FindIdForm />
    </main>
  );
}
