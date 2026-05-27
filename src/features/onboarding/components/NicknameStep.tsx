'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import {
  nicknameSchema,
  type NicknameFormValues,
} from '@/features/onboarding/schemas/nickname';

/**
 * <NicknameStep /> — 온보딩 step 3
 *
 * 닉네임 입력 + zod 검증. 제출 시 부모(OnboardingFlow)가 receive해서
 * onboardingApi.complete로 전송. regionCode는 OnboardingFlow가 location-store에서 가져옴.
 */
export function NicknameStep({
  onSubmit,
  onPrev,
}: {
  onSubmit?: (nickname: string) => void | Promise<void>;
  onPrev?: () => void;
}) {
  const t = useTranslations('onboarding');
  const tErr = useTranslations('onboarding.nickname.errors');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NicknameFormValues>({
    resolver: zodResolver(nicknameSchema),
    defaultValues: { nickname: '' },
  });

  const submit = handleSubmit(async (values) => {
    await onSubmit?.(values.nickname);
  });

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: '1rem' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
        {t('nickname.title')}
      </h2>

      <div>
        <input
          type="text"
          placeholder={t('nickname.placeholder')}
          maxLength={20}
          autoFocus
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            fontSize: '1rem',
          }}
          {...register('nickname')}
        />
        {errors.nickname && (
          <p
            style={{
              color: 'var(--color-danger)',
              fontSize: '0.8125rem',
              marginTop: 6,
            }}
          >
            {tErr(errors.nickname.message as Parameters<typeof tErr>[0])}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {onPrev && (
          <button
            type="button"
            onClick={onPrev}
            disabled={isSubmitting}
            style={{
              padding: '0.875rem 1rem',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              background: 'transparent',
            }}
          >
            {t('back')}
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            flex: 1,
            padding: '0.875rem',
            background: 'var(--color-primary)',
            color: 'var(--color-primary-fg)',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
          }}
        >
          {t('nickname.submit')}
        </button>
      </div>
    </form>
  );
}
