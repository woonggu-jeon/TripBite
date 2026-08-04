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
import { Lock, Mail } from 'lucide-react';
import { Button, TextField } from '@/components/ui';
import { AuthHero } from './AuthHero';
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
      // 시안에 "발송 완료" 화면은 없다 — authItme 규격(원형 84 + 24/14)만 맞췄다.
      <div className={styles.authPanel}>
        <AuthHero
          icon={<Mail size={36} />}
          title={t('sentTitle')}
          description={t('sentDescription')}
        />
        <Link href="/login" className={styles.authBottomLink}>
          {t('toLogin')}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className={styles.authPanel}>
      {/* Figma `authItme` — 원형 84(자물쇠) + 제목 24 + 설명.
          설명은 시안이 "이메일만" 이라고 하지만 이 폼은 아이디+이메일 두 개를
          받으므로 기존 description(사실과 맞는 문구) 을 그대로 쓴다. */}
      <AuthHero
        icon={<Lock size={36} />}
        title={t('heroTitle')}
        description={t('description')}
      />

      <div className={styles.authFields}>
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
          placeholder="you@example.com"
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
      </div>

      {/* 시안은 이 링크를 화면 하단에 붙인다 */}
      <Link href="/login" className={styles.authBottomLink}>
        {t('toLogin')}
      </Link>
    </form>
  );
}
