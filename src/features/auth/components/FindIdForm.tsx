'use client';

import Image from 'next/image';
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
import { Button, TextField } from '@/components/ui';
import styles from './AuthForm.module.scss';

/**
 * 아이디 찾기 — 가입 이메일만으로 매칭 → 마스킹 아이디를 화면에 표시.
 * 백엔드가 마스킹(tes***01) 처리. 미존재 시에도 동일 안내(열거 방지).
 */
const FIELDS = [
  { name: 'email', type: 'email', autoComplete: 'email' },
] as const;

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
    defaultValues: { email: '' },
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
      {/* Figma 아이디 찾기 hero — 84px icon + 제목 + 설명. */}
      <div className={styles.hero}>
        <Image
          src="/images/auth/find-id-hero.svg"
          alt=""
          width={84}
          height={84}
          className={styles.heroIcon}
          priority
        />
        <h1 className={styles.heroTitle}>{t('heroTitle')}</h1>
        <p className={styles.heroDescription}>{t('heroDescription')}</p>
      </div>

      {FIELDS.map((f) => (
        <TextField
          key={f.name}
          id={f.name}
          type={f.type}
          autoComplete={f.autoComplete}
          label={t(f.name)}
          errorMessage={
            errors[f.name]
              ? tErr(errors[f.name]?.message as Parameters<typeof tErr>[0])
              : undefined
          }
          {...register(f.name)}
        />
      ))}

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

      <Link href="/login" className={styles.footLinkBack}>
        {t('toLogin')}
      </Link>
    </form>
  );
}
