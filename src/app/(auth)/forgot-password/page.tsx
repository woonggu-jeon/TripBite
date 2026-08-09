import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ComingSoon } from '@/components/feedback/ComingSoon';
import { AuthHeader } from '@/components/layout/AuthHeader';
import { AuthLayout } from '@/components/layout/AuthLayout';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth.forgotPassword');
  return { title: t('title') };
}

// BE-TODO(§5 P1-2): 비밀번호 찾기 — Spring 미지원(POST /auth/forgot-password 없음) → 준비중.
//   엔드포인트 추가 시 ComingSoon → ForgotPasswordForm + useForgotPassword 복원.
export default async function ForgotPasswordPage() {
  const t = await getTranslations('auth.forgotPassword');
  return (
    <AuthLayout variant="column" header={<AuthHeader />}>
      <ComingSoon title={t('title')} />
    </AuthLayout>
  );
}
