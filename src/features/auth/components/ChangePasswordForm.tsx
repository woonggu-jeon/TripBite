'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useChangePassword } from '@/features/auth/hooks/use-auth';
import {
  changePasswordSchema,
  type ChangePasswordValues,
} from '@/features/auth/schemas/password-reset';
import { isAxiosError } from '@/services/interceptors/auth';
import { toast } from '@/lib/toast';
import { Button, TextField } from '@/components/ui';
import styles from './AuthForm.module.scss';

/**
 * 비밀번호 변경 (로그인 상태) — 현재 비번 확인 + 새 비번(10자+) + 확인.
 * 설정 계정 섹션에서 인라인으로 펼쳐 사용. 성공 시 onDone 으로 닫음.
 */
const FIELDS = [
  { name: 'currentPassword', auto: 'current-password' },
  { name: 'newPassword', auto: 'new-password' },
  { name: 'confirmPassword', auto: 'new-password' },
] as const;

export function ChangePasswordForm({ onDone }: { onDone?: () => void }) {
  const t = useTranslations('auth.changePassword');
  const tErr = useTranslations('auth.changePassword.errors');
  const { mutateAsync: change } = useChangePassword();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await change({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success(t('success'));
      reset();
      onDone?.();
    } catch (err) {
      const message = isAxiosError(err)
        ? ((err.response?.data as { message?: string })?.message ?? t('failed'))
        : t('failed');
      setError('root', { message });
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className={styles.form}>
      {FIELDS.map((f) => (
        <TextField
          key={f.name}
          id={f.name}
          type="password"
          autoComplete={f.auto}
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
        fullWidth
        loading={isSubmitting}
        disabled={isSubmitting}
      >
        {isSubmitting ? t('submitting') : t('submit')}
      </Button>
    </form>
  );
}
