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
      <div
        style={{
          maxWidth: 360,
          textAlign: 'center',
          display: 'grid',
          gap: '1rem',
        }}
      >
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
          {t('invalidTitle')}
        </h1>
        <p style={{ color: 'var(--color-muted)' }}>{t('invalidDescription')}</p>
        <Link href="/forgot-password" style={{ color: 'var(--color-primary)' }}>
          {t('retry')}
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      style={{ display: 'grid', gap: '1rem', width: '100%', maxWidth: 360 }}
    >
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{t('title')}</h1>

      <input type="hidden" {...register('token')} />

      <div>
        <label
          htmlFor="password"
          style={{ fontSize: '0.875rem', fontWeight: 500 }}
        >
          {t('password')}
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          style={{
            width: '100%',
            marginTop: 6,
            padding: '0.75rem',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
          }}
          {...register('password')}
        />
        {errors.password && (
          <p
            style={{
              color: 'var(--color-danger)',
              fontSize: '0.8125rem',
              marginTop: 4,
            }}
          >
            {tErr(errors.password.message as Parameters<typeof tErr>[0])}
          </p>
        )}
      </div>

      {errors.root && (
        <p style={{ color: 'var(--color-danger)' }} role="alert">
          {errors.root.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        style={{
          padding: '0.875rem',
          background: 'var(--color-primary)',
          color: 'var(--color-primary-fg)',
          borderRadius: 'var(--radius-md)',
          fontWeight: 600,
        }}
      >
        {isSubmitting ? t('submitting') : t('submit')}
      </button>
    </form>
  );
}
