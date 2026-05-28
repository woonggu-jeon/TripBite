'use client';

import Link from 'next/link';
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
import styles from './LoginForm.module.scss';

/**
 * 로그인 폼 — i18n 적용 예시
 *
 * 정적 UI 텍스트는 모두 useTranslations 로 처리.
 * Zod 에러 메시지는 두 가지 패턴이 가능:
 *
 *   (a) 스키마에서 i18n 키만 반환 → 컴포넌트에서 t() 로 변환 (지금 방식)
 *       스키마: z.string().min(1, 'auth.login.emailRequired')
 *       UI:    {errors.email && <p>{t(errors.email.message)}</p>}
 *
 *   (b) 컴포넌트에서 t를 받아 스키마를 동적 생성
 *       const schema = makeLoginSchema(t);
 *
 * 둘 다 유효. (a) 가 더 간단해서 권장.
 */
export function LoginForm() {
  const t = useTranslations('auth.login');
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  const { mutateAsync: login } = useLogin();

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values);
      void redirect;
    } catch (err) {
      const message = isAxiosError(err)
        ? ((err.response?.data as { message?: string })?.message ?? t('failed'))
        : t('unknown');
      setError('root', { message });
    }
  });

  return (
    <form onSubmit={onSubmit} className={styles.form} noValidate>
      <h1 className={styles.title}>{t('title')}</h1>

      <div className={styles.field}>
        <label htmlFor="username" className={styles.label}>
          {t('username')}
        </label>
        <input
          id="username"
          type="text"
          autoComplete="username"
          className={styles.input}
          aria-invalid={!!errors.username}
          {...register('username')}
        />
        {/* Zod 메시지는 i18n 키 — t(key) 로 변환 */}
        {errors.username && (
          <p className={styles.error}>
            {t(errors.username.message as Parameters<typeof t>[0])}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="password" className={styles.label}>
          {t('password')}
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className={styles.input}
          aria-invalid={!!errors.password}
          {...register('password')}
        />
        {errors.password && (
          <p className={styles.error}>
            {t(errors.password.message as Parameters<typeof t>[0])}
          </p>
        )}
      </div>

      {errors.root && (
        <p className={styles.error} role="alert">
          {errors.root.message}
        </p>
      )}

      <button type="submit" disabled={isSubmitting} className={styles.submit}>
        {isSubmitting ? t('submitting') : t('submit')}
      </button>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '1rem',
          fontSize: '0.875rem',
        }}
      >
        <Link href="/signup" style={{ color: 'var(--color-primary)' }}>
          {t('toSignup')}
        </Link>
        <span style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href="/find-id" style={{ color: 'var(--color-muted)' }}>
            {t('toFindId')}
          </Link>
          <Link href="/forgot-password" style={{ color: 'var(--color-muted)' }}>
            {t('toForgot')}
          </Link>
        </span>
      </div>
    </form>
  );
}
