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
import { Button, TextField } from '@/components/ui';
import styles from './AuthForm.module.scss';

/**
 * 로그인 폼 — i18n 적용 예시
 *
 * 정적 UI 텍스트는 모두 useTranslations 로 처리.
 * Zod 메시지는 i18n 키만 반환 → 컴포넌트에서 t() 로 변환.
 */
type LoginField = {
  name: 'username' | 'password';
  type: 'text' | 'password';
  autoComplete: 'username' | 'current-password';
};

const FIELDS: readonly LoginField[] = [
  { name: 'username', type: 'text', autoComplete: 'username' },
  { name: 'password', type: 'password', autoComplete: 'current-password' },
] as const;

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

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values);
    } catch (err) {
      const message = isAxiosError(err)
        ? ((err.response?.data as { message?: string })?.message ?? t('failed'))
        : t('unknown');
      setError('root', { message });
    }
  });

  return (
    <form
      onSubmit={onSubmit}
      className={`${styles.form} ${styles.card}`}
      noValidate
    >
      <h1 className={styles.title}>{t('title')}</h1>

      {FIELDS.map((f) => (
        <TextField
          key={f.name}
          id={f.name}
          type={f.type}
          autoComplete={f.autoComplete}
          label={t(f.name)}
          errorMessage={
            errors[f.name]
              ? t(errors[f.name]?.message as Parameters<typeof t>[0])
              : undefined
          }
          {...register(f.name)}
        />
      ))}

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
