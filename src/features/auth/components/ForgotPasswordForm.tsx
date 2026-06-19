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
import { Button, TextField } from '@/components/ui';
import styles from './AuthForm.module.scss';

/**
 * 비밀번호 찾기 — 이메일 입력 → 백엔드가 재설정 링크 메일 발송.
 * 보안상 "계정 존재 여부"를 노출하지 않도록, 성공/실패 무관하게 동일 안내 표시.
 */
export function ForgotPasswordForm() {
  const t = useTranslations('auth.forgotPassword');
  const tErr = useTranslations('auth.forgotPassword.errors');
  const { mutateAsync: forgot, isSuccess, isPending } = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { username: '', email: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      // BE ForgotPasswordDto = { username, email } — 둘 다 일치 시에만 reset
      // 링크 발송 (BE 보안 정책). 미일치 시에도 동일 안내 (열거 방지).
      await forgot(values);
    } catch {
      /* swallow — 동일 안내 (열거 방지) */
    }
  });

  if (isSuccess) {
    return (
      <div className={`${styles.form} ${styles.center}`}>
        <h1 className={styles.title}>{t('sentTitle')}</h1>
        <p className={styles.subtitle}>{t('sentDescription')}</p>
        <Link href="/login" className={styles.footLinkPrimary}>
          {t('toLogin')}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className={styles.form}>
      <h1 className={styles.title}>{t('title')}</h1>
      <p className={styles.subtitle}>{t('description')}</p>

      <TextField
        id="username"
        type="text"
        autoComplete="username"
        label={t('username')}
        placeholder={t('usernamePlaceholder')}
        errorMessage={
          errors.username
            ? tErr(errors.username.message as Parameters<typeof tErr>[0])
            : undefined
        }
        {...register('username')}
      />

      <TextField
        id="email"
        type="email"
        autoComplete="email"
        label={t('email')}
        placeholder={t('emailPlaceholder')}
        errorMessage={
          errors.email
            ? tErr(errors.email.message as Parameters<typeof tErr>[0])
            : undefined
        }
        {...register('email')}
      />

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={isPending}
        disabled={isPending}
      >
        {isPending ? t('submitting') : t('submit')}
      </Button>

      <Link href="/login" className={styles.footCenter}>
        {t('toLogin')}
      </Link>
    </form>
  );
}
