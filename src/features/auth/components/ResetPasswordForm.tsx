'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useResetPassword } from '@/features/auth/hooks/use-auth';
import {
  resetPasswordSchema,
  type ResetPasswordValues,
} from '@/features/auth/schemas/password-reset';
import { isAxiosError } from '@/services/interceptors/auth';
import { Button } from '@/components/ui';
import styles from './AuthForm.module.scss';

/**
 * 비밀번호 재설정 — 메일 링크의 토큰(?token=) + 새 비밀번호(10자+).
 * 토큰이 없으면 만료/잘못된 링크 안내.
 */
export function ResetPasswordForm() {
  const t = useTranslations('auth.resetPassword');
  const tErr = useTranslations('auth.signup.errors');
  const token = useSearchParams().get('token') ?? '';
  const { mutateAsync: reset } = useResetPassword();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await reset(values);
    } catch (err) {
      const message = isAxiosError(err)
        ? ((err.response?.data as { message?: string })?.message ?? t('failed'))
        : t('failed');
      setError('root', { message });
    }
  });

  if (!token) {
    return (
      <div className={`${styles.form} ${styles.center}`}>
        <h1 className={styles.title}>{t('invalidTitle')}</h1>
        <p className={styles.subtitle}>{t('invalidDescription')}</p>
        <Link href="/forgot-password" className={styles.footLinkPrimary}>
          {t('retry')}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className={styles.form}>
      <h1 className={styles.title}>{t('title')}</h1>

      <input type="hidden" {...register('token')} />

      <div className={styles.field}>
        <label htmlFor="password" className={styles.label}>
          {t('password')}
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          className={styles.input}
          {...register('password')}
        />
        {errors.password && (
          <p className={styles.error}>
            {tErr(errors.password.message as Parameters<typeof tErr>[0])}
          </p>
        )}
      </div>

      {errors.root && (
        <p className={styles.error} role="alert">
          {errors.root.message}
        </p>
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
    </form>
  );
}
