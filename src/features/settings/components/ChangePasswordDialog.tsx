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
import { Button, Dialog, PasswordField } from '@/components/ui';
import styles from './ChangePasswordDialog.module.scss';

/**
 * 비밀번호 변경 dialog — Figma "비밀번호 변경 모달" (2026-06-23) 정합.
 *
 * Dialog actions slot 의 cancel + confirm 2 button row 패턴. 이전
 * ChangePasswordForm 의 내부 submit Button (Figma 외) 을 Dialog actions
 * 의 confirm 으로 옮김 — form 로직은 본 Dialog 안 inline. 폼 외부 사용처
 * 없어 별도 컴포넌트 분리 불필요.
 *
 * fields: 현재 비밀번호 / 새 비밀번호 / 새 비밀번호 확인 (각 PasswordField
 * — eye toggle 포함). 검증 zodResolver + changePasswordSchema 재사용.
 */
const FIELDS = [
  { name: 'currentPassword', auto: 'current-password' },
  { name: 'newPassword', auto: 'new-password' },
  { name: 'confirmPassword', auto: 'new-password' },
] as const;

export function ChangePasswordDialog({ onClose }: { onClose: () => void }) {
  const t = useTranslations('settings.account.changePasswordDialog');
  const tAuth = useTranslations('auth.changePassword');
  const tAuthErr = useTranslations('auth.changePassword.errors');
  const tCommon = useTranslations('common');
  const { mutateAsync: change, isPending } = useChangePassword();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
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
      toast.success(tAuth('success'));
      reset();
      onClose();
    } catch (err) {
      const message = isAxiosError(err)
        ? ((err.response?.data as { message?: string })?.message ??
          tAuth('failed'))
        : tAuth('failed');
      setError('root', { message });
    }
  });

  return (
    <Dialog
      open
      onClose={onClose}
      title={t('title')}
      actions={
        <>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            {tCommon('cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={() => void onSubmit()}
            loading={isPending}
            disabled={isPending}
          >
            {tCommon('save')}
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className={styles.form}>
        {FIELDS.map((f) => (
          <PasswordField
            key={f.name}
            id={f.name}
            autoComplete={f.auto}
            label={tAuth(f.name)}
            errorMessage={
              errors[f.name]
                ? tAuthErr(
                    errors[f.name]?.message as Parameters<typeof tAuthErr>[0],
                  )
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
      </form>
    </Dialog>
  );
}
