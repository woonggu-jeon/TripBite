'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui';
import styles from './AuthForm.module.scss';

/**
 * 회원가입 완료 화면 (Figma "회원가입 완료" 노드).
 *
 *   96px 체크 아이콘 + 제목 ExtraBold 23 + 안내 Regular 14 (1.55 line)
 *   + 큰 CTA "시작하기" (primary, full-width, 52px)
 *
 * 진입 흐름: useSignup onSuccess → /signup/complete → 본 view.
 * CTA → /onboarding 진행 (자동 로그인 완료 상태).
 */
export function SignupCompleteView() {
  const t = useTranslations('auth.signup.complete');
  const router = useRouter();

  return (
    <div className={`${styles.form} ${styles.center}`}>
      <div className={styles.hero}>
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
        onClick={() => router.replace('/onboarding')}
      >
        {t('cta')}
      </Button>
    </div>
  );
}
