'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  letterSchema,
  graphemeLength,
  type LetterFormValues,
} from '@/features/letter/schemas/letter';
import { useSendLetter } from '@/features/letter/hooks/use-letters';

/**
 * 편지 작성 폼 (i18n)
 *
 * - 라벨에 {count} placeholder 보간 (next-intl)
 * - 에러 메시지는 키 → t() 변환
 */
export function LetterComposeForm() {
  const t = useTranslations('letter.compose');
  const tErr = useTranslations('letter.compose.errors');
  const router = useRouter();
  const { mutateAsync: send } = useSendLetter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LetterFormValues>({
    resolver: zodResolver(letterSchema),
    defaultValues: { body: '' },
  });

  const body = watch('body') ?? '';
  const count = graphemeLength(body);

  const onSubmit = handleSubmit(async (values) => {
    await send(values);
    router.replace('/letter');
  });

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: '1rem' }}>
      <div>
        <label htmlFor="body" style={{ fontSize: '0.875rem', fontWeight: 500 }}>
          {t('label', { count })}
        </label>
        <input
          id="body"
          type="text"
          maxLength={10}
          placeholder={t('placeholder')}
          style={{
            width: '100%',
            marginTop: 8,
            padding: '0.75rem',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            fontSize: '1.125rem',
            textAlign: 'center',
            letterSpacing: '0.5em',
          }}
          {...register('body')}
        />
        {errors.body && (
          <p
            style={{
              color: 'var(--color-danger)',
              fontSize: '0.8125rem',
              marginTop: 6,
            }}
          >
            {tErr(errors.body.message as Parameters<typeof tErr>[0])}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        style={{
          padding: '0.875rem',
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
