'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import {
  nicknameSchema,
  type NicknameFormValues,
} from '@/features/onboarding/schemas/nickname';
import { Button, TextField } from '@/components/ui';
import styles from './OnboardingStep.module.scss';

/**
 * <NicknameStep /> — 온보딩 step 3 (현재 미노출, 컴포넌트는 보존)
 *
 * 닉네임 입력 + zod 검증. 제출 시 부모(OnboardingFlow) 가 onboardingApi.complete 로 전송.
 * 라벨은 시각 미노출 (placeholder 로 의미 전달, 스크린리더에는 노출).
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

      <TextField
        id="nickname"
        type="text"
        label={t('nickname.title')}
        visuallyHiddenLabel
        placeholder={t('nickname.placeholder')}
        maxLength={20}
        errorMessage={
          errors.nickname
            ? tErr(errors.nickname.message as Parameters<typeof tErr>[0])
            : undefined
        }
        {...register('nickname')}
      />

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
