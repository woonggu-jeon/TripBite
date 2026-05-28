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

const inputStyle = {
  width: '100%',
  marginTop: 6,
  padding: '0.75rem',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
} as const;

/**
 * 비밀번호 변경 (로그인 상태) — 현재 비번 확인 + 새 비번(10자+) + 확인.
 * 설정 계정 섹션에서 인라인으로 펼쳐 사용. 성공 시 onDone으로 닫음.
 */
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

  const fields = [
    { name: 'currentPassword', auto: 'current-password' },
    { name: 'newPassword', auto: 'new-password' },
    { name: 'confirmPassword', auto: 'new-password' },
  ] as const;

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      style={{ display: 'grid', gap: '0.75rem' }}
    >
      {fields.map((f) => (
        <div key={f.name}>
          <label
            htmlFor={f.name}
            style={{ fontSize: '0.8125rem', fontWeight: 500 }}
          >
            {t(f.name)}
          </label>
          <input
            id={f.name}
            type="password"
            autoComplete={f.auto}
            aria-invalid={!!errors[f.name]}
            style={inputStyle}
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
        <p
          style={{ color: 'var(--color-danger)', fontSize: '0.8125rem' }}
          role="alert"
        >
          {errors.root.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        style={{
          padding: '0.75rem',
          background: 'var(--color-primary)',
          color: 'var(--color-primary-fg)',
          borderRadius: 'var(--radius-md)',
          fontWeight: 600,
        }}
      >
        {isSubmitting ? t('submitting') : t('submit')}
      </button>
    </form>
  );
}
