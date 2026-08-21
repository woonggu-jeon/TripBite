'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Icon } from '@/components/icon';
import { Button, TextField, buttonClasses } from '@/components/ui';
import { useFindId } from '@/features/auth/hooks/use-auth';
import {
  type FindIdValues,
  findIdSchema,
} from '@/features/auth/schemas/find-id';
import styles from './AuthForm.module.scss';
import { AuthHero } from './AuthHero';

/**
 * 아이디 찾기 — 가입 이메일만으로 매칭 → 마스킹 아이디를 화면에 표시.
 * 미존재 시에도 동일 안내(열거 방지). BE 는 없으면 username=null 반환.
 */
const FIELDS = [
  { name: 'email', type: 'email', autoComplete: 'email' },
] as const;

export function FindIdForm() {
  const t = useTranslations('auth.findId');
  const tErr = useTranslations('auth.findId.errors');
  const { mutateAsync: findId } = useFindId();
  const [result, setResult] = useState<string | null | undefined>(undefined);
  // 결과 문구에 쓸 이메일 — 시안은 "hi****@tripbite.kr 로 가입된 계정이에요."
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
    try {
      setSubmittedEmail(values.email);
      const username = await findId(values.email);
      setResult(username);
    } catch {
      setResult(null);
    }
  });

  if (result !== undefined) {
    // Figma `아이디 찾기 결과 (D)` — 제목/설명 → 28 여백 → 연초록 카드 →
    // "로그인하기" 버튼 → "비밀번호 찾기" 링크.
    return (
      <div className={styles.authPanel}>
        <div className={styles.resultHead}>
          <h1 className={styles.resultTitle}>
            {result ? t('foundTitle') : t('resultTitle')}
          </h1>
          <p className={styles.resultDesc}>
            {result
              ? t('foundDescription', { email: maskEmail(submittedEmail) })
              : t('notFound')}
          </p>
        </div>

        {result && (
          <div className={styles.idCard}>
            <p className={styles.idCardLabel}>{t('myIdLabel')}</p>
            <p className={styles.idCardValue}>{result}</p>
          </div>
        )}

        <Link
          href="/login"
          className={buttonClasses({
            variant: 'primary',
            size: 'lg',
            fullWidth: true,
          })}
        >
          {t('toLoginCta')}
        </Link>

        <Link href="/forgot-password" className={styles.authBottomLink}>
          {t('toForgotPassword')}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className={styles.authPanel}>
      {/* Figma `authItme` — 원형 84 + 제목 24 + 설명 2줄 */}
      <AuthHero
        icon={<Icon name="mail" size={36} />}
        title={t('heroTitle')}
        description={t('heroDescription')}
      />

      {/* Figma `Frame 3` — 입력 + 버튼, V gap 24 */}
      <div className={styles.authFields}>
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
      </div>

      {/* 시안은 이 링크를 화면 하단에 붙인다 (y 663 / 720) */}
      <Link href="/login" className={styles.authBottomLink}>
        {t('toLogin')}
      </Link>
    </form>
  );
}

/**
 * 결과 설명용 이메일 마스킹 — 시안 "hi****@tripbite.kr" 형태.
 * 로컬파트 앞 2자만 남기고 나머지를 * 로.
 */
function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at <= 0) return email;
  const local = email.slice(0, at);
  const domain = email.slice(at);
  const head = local.slice(0, 2);
  return `${head}${'*'.repeat(Math.max(1, local.length - head.length))}${domain}`;
}
