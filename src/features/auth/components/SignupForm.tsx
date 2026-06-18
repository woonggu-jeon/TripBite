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
import { Button, TextField } from '@/components/ui';
import styles from './AuthForm.module.scss';

/**
 * 회원가입 폼 — 4 필수 + 비번 확인: 아이디 / 비번+확인 / 닉네임 / 이메일.
 *
 * 임시 처리: BE SignupDto 가 아직 name/birthDate/phone 을 필수로 받아
 * defaultValues 에 placeholder 값을 박아 통과시킴 (사용자 입력 X). BE 가
 * 해당 필드 옵셔널화 (docs/BE_REQUEST_signup_simplify.md §2) 후
 * `BE_REQUIRES_LEGACY_FIELDS` 를 false 로 토글 + defaultValues placeholder 제거.
 */
const BE_REQUIRES_LEGACY_FIELDS = true;

const FIELDS = [
  { name: 'username', type: 'text', autoComplete: 'username' },
  { name: 'nickname', type: 'text', autoComplete: 'nickname' },
  { name: 'password', type: 'password', autoComplete: 'new-password' },
  { name: 'passwordConfirm', type: 'password', autoComplete: 'new-password' },
  { name: 'email', type: 'email', autoComplete: 'email' },
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
      // 사용자 입력 5 필드 (UI 노출)
      username: '',
      nickname: '',
      password: '',
      passwordConfirm: '',
      email: '',
      // BE 가 아직 필수로 받는 3 필드 — placeholder 값으로 통과.
      // name 은 onSubmit 직전에 nickname 값으로 동기 (가입 후 mypage 에서 수정 가능).
      name: BE_REQUIRES_LEGACY_FIELDS ? '회원' : '',
      birthDate: BE_REQUIRES_LEGACY_FIELDS ? '2000-01-01' : '',
      phone: BE_REQUIRES_LEGACY_FIELDS ? '010-0000-0000' : '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      // name 은 nickname 으로 동기 — 가입 후 mypage 에서 수정 가능 (또는 BE 옵셔널화 후 폼에서 제거)
      const payload = BE_REQUIRES_LEGACY_FIELDS
        ? { ...values, name: values.nickname }
        : values;
      await signup(payload);
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
