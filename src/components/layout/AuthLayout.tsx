import type { ReactNode } from 'react';
import styles from './AuthLayout.module.scss';

/**
 * 인증 페이지 공통 wrapper.
 *
 * 사용:
 *   <AuthLayout><LoginForm /></AuthLayout>                  // center 정렬
 *   <AuthLayout variant="column"><OnboardingFlow /></AuthLayout>
 *   <AuthLayout variant="column" header={<AuthHeader title="회원가입" />}>
 *
 * 6 페이지 (login/signup/find-id/forgot-password/reset-password/onboarding)
 * 의 main wrapper. 디자이너가 layout 변경 시 여기 한 곳만 수정하면 일괄 반영.
 *
 * header 를 prop 으로 받는 이유: 헤더는 좌우 여백 없이 화면 폭을 써야 하고
 * (Figma 0 20 은 헤더 자체 padding), 본문만 레이아웃 여백을 갖는다.
 *
 * Server Component — children 만 받음.
 */
export function AuthLayout({
  children,
  variant = 'center',
  header,
}: {
  children: ReactNode;
  variant?: 'center' | 'column';
  header?: ReactNode;
}) {
  if (header) {
    return (
      <main className={`${styles.main} ${styles.withHeader}`}>
        {header}
        <div className={`${styles.body} ${styles[variant]}`}>{children}</div>
      </main>
    );
  }

  return (
    <main className={`${styles.main} ${styles.padded} ${styles[variant]}`}>
      {children}
    </main>
  );
}
