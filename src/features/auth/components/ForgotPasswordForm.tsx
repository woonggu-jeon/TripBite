'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForgotPassword } from '@/features/auth/hooks/use-auth';
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from '@/features/auth/schemas/password-reset';

/**
 * 비밀번호 찾기 — 이메일 입력 → 백엔드가 재설정 링크 메일 발송.
 * 보안상 "계정 존재 여부"를 노출하지 않도록, 성공/실패 무관하게 동일 안내 표시.
 */
export function ForgotPasswordForm() {
  const t = useTranslations('auth.forgotPassword');
  const tErr = useTranslations('auth.signup.errors');
  const { mutateAsync: forgot, isSuccess, isPending } = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    // 계정 미존재여도 동일 안내 (열거 방지) — 에러를 사용자에 노출 안 함
    try {
      await forgot(values);
    } catch {
      /* swallow — 동일 안내 */
    }
  });

  if (isSuccess) {
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
          {t('sentTitle')}
        </h1>
        <p style={{ color: 'var(--color-muted)' }}>{t('sentDescription')}</p>
        <Link href="/login" style={{ color: 'var(--color-primary)' }}>
          {t('toLogin')}
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
      <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>
        {t('description')}
      </p>

      <div>
        <label
          htmlFor="email"
          style={{ fontSize: '0.875rem', fontWeight: 500 }}
        >
          {t('email')}
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          style={{
            width: '100%',
            marginTop: 6,
            padding: '0.75rem',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
          }}
          {...register('email')}
        />
        {errors.email && (
          <p
            style={{
              color: 'var(--color-danger)',
              fontSize: '0.8125rem',
              marginTop: 4,
            }}
          >
            {tErr(errors.email.message as Parameters<typeof tErr>[0])}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        style={{
          padding: '0.875rem',
          background: 'var(--color-primary)',
          color: 'var(--color-primary-fg)',
          borderRadius: 'var(--radius-md)',
          fontWeight: 600,
        }}
      >
        {isPending ? t('submitting') : t('submit')}
      </button>

      <Link
        href="/login"
        style={{
          textAlign: 'center',
          fontSize: '0.875rem',
          color: 'var(--color-muted)',
        }}
      >
        {t('toLogin')}
      </Link>
    </form>
  );
}
