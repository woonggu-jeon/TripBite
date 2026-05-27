'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useSignup } from '@/features/auth/hooks/use-auth';
import {
  signupSchema,
  type SignupFormValues,
} from '@/features/auth/schemas/signup';
import { isAxiosError } from '@/services/interceptors/auth';

/**
 * 회원가입 폼 — 이름/아이디/비번(10+)/생년월일/이메일/폰 (전부 필수)
 *
 * 검증은 signupSchema(zod). 에러 메시지는 i18n 키 → t() 변환.
 * 중복확인/실제 가입은 백엔드 (POST /auth/signup).
 */
const FIELDS = [
  { name: 'name', type: 'text', autoComplete: 'name' },
  { name: 'username', type: 'text', autoComplete: 'username' },
  { name: 'password', type: 'password', autoComplete: 'new-password' },
  { name: 'birthDate', type: 'date', autoComplete: 'bday' },
  { name: 'email', type: 'email', autoComplete: 'email' },
  { name: 'phone', type: 'tel', autoComplete: 'tel' },
] as const;

export function SignupForm() {
  const t = useTranslations('auth.signup');
  const tErr = useTranslations('auth.signup.errors');
  const { mutateAsync: signup } = useSignup();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      username: '',
      password: '',
      birthDate: '',
      email: '',
      phone: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await signup(values);
    } catch (err) {
      const message = isAxiosError(err)
        ? ((err.response?.data as { message?: string })?.message ?? t('failed'))
        : t('failed');
      setError('root', { message });
    }
  });

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      style={{
        display: 'grid',
        gap: '1rem',
        width: '100%',
        maxWidth: 360,
      }}
    >
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{t('title')}</h1>

      {FIELDS.map((f) => (
        <div key={f.name}>
          <label
            htmlFor={f.name}
            style={{ fontSize: '0.875rem', fontWeight: 500 }}
          >
            {t(f.name)}
          </label>
          <input
            id={f.name}
            type={f.type}
            autoComplete={f.autoComplete}
            placeholder={t(`${f.name}Placeholder`)}
            aria-invalid={!!errors[f.name]}
            style={{
              width: '100%',
              marginTop: 6,
              padding: '0.75rem',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
            }}
            {...register(f.name)}
          />
          {errors[f.name] && (
            <p
              style={{
                color: 'var(--color-danger)',
                fontSize: '0.8125rem',
                marginTop: 4,
              }}
            >
              {tErr(errors[f.name]?.message as Parameters<typeof tErr>[0])}
            </p>
          )}
        </div>
      ))}

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
