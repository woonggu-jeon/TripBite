'use client';

import { Link } from '@/i18n/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useSignup } from '@/features/auth/hooks/use-auth';
import {
  signupSchema,
  type SignupFormValues,
} from '@/features/auth/schemas/signup';
import { isAxiosError } from '@/services/interceptors/auth';
import { Button, TextField } from '@/components/ui';
import styles from './AuthForm.module.scss';

/**
 * 회원가입 폼 — 이름/아이디/비번(10+)/생년월일/이메일/폰 (전부 필수)
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
    <form onSubmit={onSubmit} noValidate className={styles.form}>
      <h1 className={styles.title}>{t('title')}</h1>

      {FIELDS.map((f) => (
        <TextField
          key={f.name}
          id={f.name}
          type={f.type}
          autoComplete={f.autoComplete}
          placeholder={t(`${f.name}Placeholder`)}
          label={t(f.name)}
          errorMessage={
            errors[f.name]
              ? tErr(errors[f.name]?.message as Parameters<typeof tErr>[0])
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

      <Link href="/login" className={styles.footCenter}>
        {t('toLogin')}
      </Link>
    </form>
  );
}
