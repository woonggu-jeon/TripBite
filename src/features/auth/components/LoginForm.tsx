'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useLogin } from '@/features/auth/hooks/use-auth';
import {
  loginSchema,
  type LoginFormValues,
} from '@/features/auth/schemas/login';
import { isAxiosError } from '@/services/interceptors/auth';
import { Button, PasswordField, TextField } from '@/components/ui';
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
    <form
      onSubmit={onSubmit}
      className={`${styles.form} ${styles.card}`}
      noValidate
    >
      <h1 className={styles.title}>{t('title')}</h1>

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

      <div className={styles.foot}>
        <Link href="/signup" className={styles.footLinkPrimary}>
          {t('toSignup')}
        </Link>
        <span className={styles.footRight}>
          <Link href="/find-id" className={styles.footLinkMuted}>
            {t('toFindId')}
          </Link>
          <Link href="/forgot-password" className={styles.footLinkMuted}>
            {t('toForgot')}
          </Link>
        </span>
      </div>
    </form>
  );
}
