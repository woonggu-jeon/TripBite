'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useSignup } from '@/features/auth/hooks/use-auth';
import { authApi } from '@/features/auth/api/auth';
import {
  signupSchema,
  type SignupFormValues,
} from '@/features/auth/schemas/signup';
import { isAxiosError } from '@/services/interceptors/auth';
import { Button, TextField } from '@/components/ui';
import styles from './AuthForm.module.scss';

/**
 * 회원가입 폼 — 4 필수: username / password (+ confirm) / nickname / email.
 *
 * 중복확인: username 만 (GET /auth/check-username) — debounce 후 자동 호출.
 * nickname 은 BE 정책상 unique 아님 (NICKNAME_TAKEN 코드 없음).
 */
const FIELDS = [
  { name: 'username', type: 'text', autoComplete: 'username' },
  { name: 'nickname', type: 'text', autoComplete: 'nickname' },
  { name: 'password', type: 'password', autoComplete: 'new-password' },
  { name: 'passwordConfirm', type: 'password', autoComplete: 'new-password' },
  { name: 'email', type: 'email', autoComplete: 'email' },
] as const;

const USERNAME_CHECK_REGEX = /^[a-zA-Z0-9]{4,20}$/;
const CHECK_DEBOUNCE_MS = 400;

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

export function SignupForm() {
  const t = useTranslations('auth.signup');
  const tErr = useTranslations('auth.signup.errors');
  const { mutateAsync: signup } = useSignup();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: '',
      nickname: '',
      password: '',
      passwordConfirm: '',
      email: '',
    },
  });

  // username 중복확인 — debounce 후 자동. pattern 통과한 경우만 호출.
  const usernameValue = watch('username');
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');

  useEffect(() => {
    if (!usernameValue) {
      setUsernameStatus('idle');
      return;
    }
    if (!USERNAME_CHECK_REGEX.test(usernameValue)) {
      setUsernameStatus('invalid');
      return;
    }
    setUsernameStatus('checking');
    const ctrl = new AbortController();
    const id = window.setTimeout(async () => {
      try {
        const res = await authApi.checkUsername(usernameValue);
        if (ctrl.signal.aborted) return;
        setUsernameStatus(res.available ? 'available' : 'taken');
      } catch {
        if (ctrl.signal.aborted) return;
        setUsernameStatus('idle');
      }
    }, CHECK_DEBOUNCE_MS);
    return () => {
      ctrl.abort();
      window.clearTimeout(id);
    };
  }, [usernameValue]);

  const onSubmit = handleSubmit(async (values) => {
    if (usernameStatus === 'taken') {
      setError('username', { message: 'usernameTaken' });
      return;
    }
    try {
      // passwordConfirm 은 BE 안 보냄
      const { passwordConfirm: _unused, ...payload } = values;
      void _unused;
      await signup(payload);
    } catch (err) {
      const message = isAxiosError(err)
        ? ((err.response?.data as { message?: string })?.message ?? t('failed'))
        : t('failed');
      setError('root', { message });
    }
  });

  const usernameError = errors.username
    ? tErr(errors.username.message as Parameters<typeof tErr>[0])
    : usernameStatus === 'taken'
      ? tErr('usernameTaken')
      : undefined;
  const usernameHint =
    usernameStatus === 'checking'
      ? t('usernameChecking')
      : usernameStatus === 'available'
        ? t('usernameAvailable')
        : undefined;

  return (
    <form onSubmit={onSubmit} noValidate className={styles.form}>
      <h1 className={styles.title}>{t('title')}</h1>

      {FIELDS.map((f) => {
        const isUsername = f.name === 'username';
        const fieldError = errors[f.name];
        const errorMessage = isUsername
          ? usernameError
          : fieldError
            ? tErr(fieldError.message as Parameters<typeof tErr>[0])
            : undefined;
        return (
          <TextField
            key={f.name}
            id={f.name}
            type={f.type}
            autoComplete={f.autoComplete}
            placeholder={t(`${f.name}Placeholder`)}
            label={t(f.name)}
            errorMessage={errorMessage}
            hint={isUsername ? usernameHint : undefined}
            {...register(f.name)}
          />
        );
      })}

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
        disabled={isSubmitting || usernameStatus === 'taken'}
      >
        {isSubmitting ? t('submitting') : t('submit')}
      </Button>

      <Link href="/login" className={styles.footCenter}>
        {t('toLogin')}
      </Link>
    </form>
  );
}
