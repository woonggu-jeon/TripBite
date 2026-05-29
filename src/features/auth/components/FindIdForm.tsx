'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useFindId } from '@/features/auth/hooks/use-auth';
import {
  findIdSchema,
  type FindIdValues,
} from '@/features/auth/schemas/find-id';
import { Button } from '@/components/ui';
import styles from './AuthForm.module.scss';

/**
 * 아이디 찾기 — 이름 + 가입 이메일 매칭 → 마스킹 아이디를 화면에 표시.
 * 백엔드가 마스킹(tes***01) 처리. 미존재 시에도 동일 안내(열거 방지).
 */
export function FindIdForm() {
  const t = useTranslations('auth.findId');
  const tErr = useTranslations('auth.findId.errors');
  const { mutateAsync: findId } = useFindId();
  const [result, setResult] = useState<string | null | undefined>(undefined);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FindIdValues>({
    resolver: zodResolver(findIdSchema),
    defaultValues: { name: '', email: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const res = await findId(values);
      setResult(res.username);
    } catch {
      setResult(null);
    }
  });

  if (result !== undefined) {
    return (
      <div className={`${styles.form} ${styles.center}`}>
        <h1 className={styles.title}>{t('resultTitle')}</h1>
        {result ? (
          <p className={styles.resultId}>{result}</p>
        ) : (
          <p className={styles.subtitle}>{t('notFound')}</p>
        )}
        <Link href="/login" className={styles.footLinkPrimary}>
          {t('toLogin')}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className={styles.form}>
      <h1 className={styles.title}>{t('title')}</h1>

      <div className={styles.field}>
        <label htmlFor="name" className={styles.label}>
          {t('name')}
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          aria-invalid={!!errors.name}
          className={styles.input}
          {...register('name')}
        />
        {errors.name && (
          <p className={styles.error}>
            {tErr(errors.name.message as Parameters<typeof tErr>[0])}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="email" className={styles.label}>
          {t('email')}
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          className={styles.input}
          {...register('email')}
        />
        {errors.email && (
          <p className={styles.error}>
            {tErr(errors.email.message as Parameters<typeof tErr>[0])}
          </p>
        )}
      </div>

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
