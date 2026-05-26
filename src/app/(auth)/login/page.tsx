import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { LoginForm } from '@/features/auth/components/LoginForm';

/**
 * 로그인 페이지 (/login)
 * 비인증 사용자만 접근. 인증 시 / 로 리다이렉트 (middleware).
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth.login');
  return { title: t('title') };
}

export default function LoginPage() {
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
      <LoginForm />
    </main>
  );
}
