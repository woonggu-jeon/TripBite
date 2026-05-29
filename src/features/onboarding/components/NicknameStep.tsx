'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import {
  nicknameSchema,
  type NicknameFormValues,
} from '@/features/onboarding/schemas/nickname';
import { Button } from '@/components/ui';
import authStyles from '@/features/auth/components/AuthForm.module.scss';
import styles from './OnboardingStep.module.scss';

/**
 * <NicknameStep /> — 온보딩 step 3 (현재 미노출, 컴포넌트는 보존)
 *
 * 닉네임 입력 + zod 검증. 제출 시 부모(OnboardingFlow) 가 onboardingApi.complete 로 전송.
 * 폼 요소는 AuthForm module 의 .field/.input/.error 재사용.
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
    <form onSubmit={submit} className={styles.step}>
      <h2 className={styles.title}>{t('nickname.title')}</h2>

      <div className={authStyles.field}>
        <input
          type="text"
          placeholder={t('nickname.placeholder')}
          maxLength={20}
          className={authStyles.input}
          aria-invalid={!!errors.nickname}
          {...register('nickname')}
        />
        {errors.nickname && (
          <p className={authStyles.error}>
            {tErr(errors.nickname.message as Parameters<typeof tErr>[0])}
          </p>
        )}
      </div>

      <div className={`${styles.actions} ${styles.actionsRow}`}>
        {onPrev && (
          <Button variant="secondary" onClick={onPrev} disabled={isSubmitting}>
            {t('back')}
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {t('nickname.submit')}
        </Button>
      </div>
    </form>
  );
}
