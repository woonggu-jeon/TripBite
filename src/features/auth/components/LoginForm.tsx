'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, PasswordField, TextField } from '@/components/ui';
import { useLogin } from '@/features/auth/hooks/use-auth';
import {
  type LoginFormValues,
  loginSchema,
} from '@/features/auth/schemas/login';
import { isAxiosError } from '@/services/interceptors/auth';
import styles from './AuthForm.module.scss';

/**
 * 로그인 폼 — i18n 적용 예시
 *
 * 정적 UI 텍스트는 모두 useTranslations 로 처리.
 * Zod 메시지는 i18n 키만 반환 → 컴포넌트에서 t() 로 변환.
 */

export function LoginForm() {
  const t = useTranslations('auth.login');
  const searchParams = useSearchParams();
  // safe redirect — 외부 URL 주입 (open redirect) 차단. 같은 origin 경로만 허용.
  const rawRedirect = searchParams.get('redirect');
  const redirect =
    rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
      ? rawRedirect
      : '/';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  const { mutateAsync: login } = useLogin({ redirectTo: redirect });

  // 계정 잠금 상태 — 비밀번호 찾기 링크 강조 노출용 별도 state.
  const [accountLocked, setAccountLocked] = useState(false);

  const onSubmit = handleSubmit(async (values) => {
    try {
      setAccountLocked(false);
      await login(values);
    } catch (err) {
      // BE 응답 code 로 분기 — 같은 429 라도 RATE_LIMIT (IP) vs
      // AUTH_ACCOUNT_LOCKED (계정 잠금) 안내 다름.
      if (isAxiosError(err)) {
        const data = err.response?.data as
          | { code?: string; message?: string }
          | undefined;
        if (data?.code === 'AUTH_ACCOUNT_LOCKED') {
          setAccountLocked(true);
          setError('root', { message: t('accountLocked') });
          return;
        }
        if (data?.code === 'RATE_LIMIT') {
          setError('root', { message: t('rateLimit') });
          return;
        }
        const message = data?.message ?? t('failed');
        setError('root', { message });
        return;
      }
      setError('root', { message: t('unknown') });
    }
  });

  return (
    <form onSubmit={onSubmit} className={styles.form} noValidate>
      {/* Figma LOGIN · A — 상단 logo 블록 (#3355:184). column gap 8 +
          padding-bottom 40. 안의 trip-bite-logo INSTANCE 는 column stack
          (gap 4) — icon 위 / "여행한입" 텍스트 아래. tagline 별도 row.
          page h1 = "여행한입" 으로 의미 변환 (Figma 디자인 그대로). 페이지
          타이틀 "로그인" 은 generateMetadata 가 처리. */}
      <div className={styles.loginLogo}>
        <div className={styles.loginLogoStack}>
          {/* SVG 는 vector — next/image optimization 불필요 + hydration
              지연 회피 (운영에서 첫 진입 시 logo 안 보이던 회귀 fix). */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/auth/trip-bite-logo.svg"
            alt=""
            width={40}
            height={37}
            className={styles.loginLogoIcon}
          />
          <h1 className={styles.loginLogoText}>{t('logoTitle')}</h1>
        </div>
        <p className={styles.loginTagline}>{t('tagline')}</p>
      </div>

      <TextField
        id="username"
        type="text"
        autoComplete="username"
        label={t('username')}
        errorMessage={
          errors.username
            ? t(errors.username.message as Parameters<typeof t>[0])
            : undefined
        }
        {...register('username')}
      />
      <PasswordField
        id="password"
        autoComplete="current-password"
        label={t('password')}
        errorMessage={
          errors.password
            ? t(errors.password.message as Parameters<typeof t>[0])
            : undefined
        }
        {...register('password')}
      />

      {errors.root && (
        <div role="alert" className={styles.error}>
          <p>{errors.root.message}</p>
          {accountLocked && (
            <Link href="/forgot-password" className={styles.errorLink}>
              {t('forgotPasswordCta')}
            </Link>
          )}
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={isSubmitting}
        disabled={isSubmitting}
      >
        {isSubmitting ? t('submitting') : t('submit')}
      </Button>

      {/* Figma LOGIN · A — 3 link 가운데 정렬 + ellipsis dot 구분.
          기존 좌측 회원가입 / 우측 분리 layout 폐기. */}
      <div className={styles.footLinks}>
        <Link href="/signup" className={styles.footLink}>
          {t('toSignup')}
        </Link>
        <span aria-hidden className={styles.footDot} />
        <Link href="/find-id" className={styles.footLink}>
          {t('toFindId')}
        </Link>
        <span aria-hidden className={styles.footDot} />
        <Link href="/forgot-password" className={styles.footLink}>
          {t('toForgot')}
        </Link>
      </div>
    </form>
  );
}
