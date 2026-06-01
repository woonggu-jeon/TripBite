import type { ReactNode } from 'react';
import styles from './AuthLayout.module.scss';

/**
 * 인증 페이지 공통 wrapper.
 *
 * 사용:
 *   <AuthLayout><LoginForm /></AuthLayout>                  // center 정렬
 *   <AuthLayout variant="column"><OnboardingFlow /></AuthLayout>
 *
 * 6 페이지 (login/signup/find-id/forgot-password/reset-password/onboarding)
 * 의 main wrapper. 디자이너가 layout 변경 시 여기 한 곳만 수정하면 일괄 반영.
 *
 * Server Component — children 만 받음.
 */
export function AuthLayout({
  children,
  variant = 'center',
}: {
  children: ReactNode;
  variant?: 'center' | 'column';
}) {
  return (
    <main className={`${styles.main} ${styles[variant]}`}>{children}</main>
  );
}
