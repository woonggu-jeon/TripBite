'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/stores/auth-store';
import { authKeys } from '@/features/auth/hooks/use-auth';
import styles from './AuthForm.module.scss';

/**
 * 회원가입 완료 화면 (Figma "회원가입 완료" 노드).
 *
 *   96px 체크 아이콘 + 제목 ExtraBold 23 + 안내 Regular 14 (1.55 line)
 *   + 큰 CTA "시작하기" (primary, full-width, 52px)
 *
 * 흐름 분리 (사용자 요청, 2026-06-19):
 *   - useSignup onSuccess → setPendingSignupUser → /signup/complete (자동
 *     로그인 X, FE store/cache 미 hydrate. BE SID 는 cookie 에 이미 있음).
 *   - 본 view 의 CTA "시작하기" → setAuth + setQueryData + clear → /onboarding.
 *
 * 직접 진입 가드: pendingSignupUser 없으면 / 로 redirect (가입 안 했는데
 * 이 페이지에 머무를 이유 없음).
 */
export function SignupCompleteView() {
  const t = useTranslations('auth.signup.complete');
  const router = useRouter();
  const queryClient = useQueryClient();
  const pendingSignupUser = useAuthStore((s) => s.pendingSignupUser);
  const setAuth = useAuthStore((s) => s.setAuth);
  const setPendingSignupUser = useAuthStore((s) => s.setPendingSignupUser);

  // 가드 — 가입 직후가 아닌 직접 진입 케이스 차단. 새로고침 시에도 pending
  // 사라져 redirect (메모리 only persist 미포함).
  useEffect(() => {
    if (!pendingSignupUser) {
      router.replace('/');
    }
  }, [pendingSignupUser, router]);

  const handleStart = () => {
    if (!pendingSignupUser) return;
    // 자동 로그인 프로세스 — 시작하기 클릭 시점에 hydrate.
    setAuth(pendingSignupUser);
    queryClient.setQueryData(authKeys.me(), pendingSignupUser);
    setPendingSignupUser(undefined);
    router.replace('/onboarding');
  };

  return (
    <div className={`${styles.form} ${styles.center}`}>
      {/* hero 의 sp / title 폰트가 FindId/FindPw 와 미세 다름 (Figma) —
          .heroSignupComplete modifier 로 sp 26 + title 23px override. */}
      <div className={`${styles.hero} ${styles.heroSignupComplete}`}>
        <Image
          src="/images/auth/signup-complete-check.svg"
          alt=""
          width={96}
          height={96}
          className={styles.heroIcon}
          priority
        />
        <h1 className={styles.heroTitle}>{t('title')}</h1>
        <p className={styles.heroDescription}>{t('description')}</p>
      </div>
      <Button
        type="button"
        variant="primary"
        size="lg"
        fullWidth
        onClick={handleStart}
        disabled={!pendingSignupUser}
      >
        {t('cta')}
      </Button>
    </div>
  );
}
