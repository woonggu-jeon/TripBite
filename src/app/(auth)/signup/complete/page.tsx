import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { SignupCompleteView } from '@/features/auth/components/SignupCompleteView';

/**
 * /signup/complete — 회원가입 직후 success 화면 (Figma "회원가입 완료" 노드).
 *
 * 진입 흐름: useSignup onSuccess → router.replace('/signup/complete').
 * 사용자가 CTA 클릭 시 /onboarding 으로 진행 (자동 로그인 완료 상태).
 *
 * 미인증 직접 진입 가능성: 첫 진입에선 SID 없이도 페이지 자체는 정상 렌더.
 * (자체 보호 X — 단순 success 안내 페이지)
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth.signup.complete');
  return { title: t('title') };
}

export default function SignupCompletePage() {
  return (
    <AuthLayout>
      <SignupCompleteView />
    </AuthLayout>
  );
}
