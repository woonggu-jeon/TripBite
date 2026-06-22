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
import { Button, TextField } from '@/components/ui';
import styles from './AuthForm.module.scss';

/**
 * 아이디 찾기 — 가입 이메일만으로 매칭 → 마스킹 아이디를 화면에 표시.
 * 백엔드가 마스킹(tes***01) 처리. 미존재 시에도 동일 안내(열거 방지).
 */
const FIELDS = [
  { name: 'email', type: 'email', autoComplete: 'email' },
] as const;

/**
 * 이메일 마스킹 — local-part 첫 2자 + "****" + "@domain".
 * 예: "hi@tripbite.kr" → "hi****@tripbite.kr"
 *     "tester@gmail.com" → "te****@gmail.com"
 * @ 없는 입력 → 그대로 (BE 가 검증 단계라 실 도달 가능성 낮음).
 */
function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at < 0) return email;
  const local = email.slice(0, at);
  const domain = email.slice(at);
  const visible = local.slice(0, 2);
  return `${visible}****${domain}`;
}

export function FindIdForm() {
  const t = useTranslations('auth.findId');
  const tErr = useTranslations('auth.findId.errors');
  const { mutateAsync: findId } = useFindId();
  const [result, setResult] = useState<string | null | undefined>(undefined);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FindIdValues>({
    resolver: zodResolver(findIdSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmittedEmail(values.email);
    try {
      const res = await findId(values);
      setResult(res.username);
    } catch {
      setResult(null);
    }
  });

  if (result !== undefined) {
    // Figma "아이디 찾기 결과" 정합 — 마스킹 이메일 + 카드 + 로그인 CTA + 비번 찾기 link.
    // BE 응답에 maskedEmail 없어서 사용자 입력 email 을 client-side 에서 mask.
    return (
      <div className={styles.form}>
        <h1 className={styles.heroTitle}>{t('resultTitle')}</h1>
        {result ? (
          <>
            <p className={styles.resultEmailHint}>
              {t('resultEmailHint', { maskedEmail: maskEmail(submittedEmail) })}
            </p>
            <div className={styles.resultCard}>
              <p className={styles.resultCardLabel}>{t('resultCardLabel')}</p>
              <p className={styles.resultCardValue}>{result}</p>
            </div>
            <Link
              href="/login"
              className={styles.footLinkBack}
              style={{ display: 'block' }}
            >
              {/* primary color CTA 버튼 대신 link 로 → /login. 자동 로그인 X 가정. */}
              {t('resultLoginCta')}
            </Link>
            <Link
              href="/forgot-password"
              className={styles.footLink}
              style={{ display: 'block', textAlign: 'center' }}
            >
              {t('resultToForgot')}
            </Link>
          </>
        ) : (
          <>
            <p className={styles.heroDescription}>{t('notFound')}</p>
            <Link href="/login" className={styles.footLinkBack}>
              {t('toLogin')}
            </Link>
          </>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className={styles.form}>
      {/* Figma 아이디 찾기 hero — 84px icon + 제목 + 설명. */}
      <div className={styles.hero}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/auth/find-id-hero.svg"
          alt=""
          width={84}
          height={84}
          className={styles.heroIcon}
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
