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

const inputStyle = {
  width: '100%',
  marginTop: 6,
  padding: '0.75rem',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
} as const;

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
      <div
        style={{
          maxWidth: 360,
          textAlign: 'center',
          display: 'grid',
          gap: '1rem',
        }}
      >
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
          {t('resultTitle')}
        </h1>
        {result ? (
          <p style={{ fontSize: '1.25rem', fontWeight: 600 }}>{result}</p>
        ) : (
          <p style={{ color: 'var(--color-muted)' }}>{t('notFound')}</p>
        )}
        <Link href="/login" style={{ color: 'var(--color-primary)' }}>
          {t('toLogin')}
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      style={{ display: 'grid', gap: '1rem', width: '100%', maxWidth: 360 }}
    >
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{t('title')}</h1>

      <div>
        <label htmlFor="name" style={{ fontSize: '0.875rem', fontWeight: 500 }}>
          {t('name')}
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          aria-invalid={!!errors.name}
          style={inputStyle}
          {...register('name')}
        />
        {errors.name && (
          <p
            style={{
              color: 'var(--color-danger)',
              fontSize: '0.8125rem',
              marginTop: 4,
            }}
          >
            {tErr(errors.name.message as Parameters<typeof tErr>[0])}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="email"
          style={{ fontSize: '0.875rem', fontWeight: 500 }}
        >
          {t('email')}
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          style={inputStyle}
          {...register('email')}
        />
        {errors.email && (
          <p
            style={{
              color: 'var(--color-danger)',
              fontSize: '0.8125rem',
              marginTop: 4,
            }}
          >
            {tErr(errors.email.message as Parameters<typeof tErr>[0])}
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

      <Link
        href="/login"
        style={{
          textAlign: 'center',
          fontSize: '0.875rem',
          color: 'var(--color-muted)',
        }}
      >
        {t('toLogin')}
      </Link>
    </form>
  );
}
