'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useLogin } from '@/features/auth/hooks/use-auth';
import {
  loginSchema,
  type LoginFormValues,
} from '@/features/auth/schemas/login';
import { isAxiosError } from '@/services/interceptors/auth';
import { Button, TextField } from '@/components/ui';
import { LogoMark } from '@/components/brand/LogoMark';
import styles from './AuthForm.module.scss';

/**
 * 로그인 폼 — i18n 적용 예시
 *
 * 정적 UI 텍스트는 모두 useTranslations 로 처리.
 * Zod 메시지는 i18n 키만 반환 → 컴포넌트에서 t() 로 변환.
 */
type LoginField = {
  name: 'username' | 'password';
  type: 'text' | 'password';
  autoComplete: 'username' | 'current-password';
};

const FIELDS: readonly LoginField[] = [
  { name: 'username', type: 'text', autoComplete: 'username' },
  { name: 'password', type: 'password', autoComplete: 'current-password' },
] as const;

export function LoginForm() {
  const t = useTranslations('auth.login');
  const tBrand = useTranslations('brand');
  const searchParams = useSearchParams();
  // safe redirect — 외부 URL 주입 (open redirect) 차단. 같은 origin 경로만 허용.
  const rawRedirect = searchParams.get('redirect');
  const redirect =
    rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
      ? rawRedirect
      : '/';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  const { mutateAsync: login } = useLogin({ redirectTo: redirect });

  // 계정 잠금 상태 — 비밀번호 찾기 링크 강조 노출용 별도 state.
  const [accountLocked, setAccountLocked] = useState(false);

  const onSubmit = handleSubmit(async (values) => {
    try {
      setAccountLocked(false);
      await login(values);
    } catch (err) {
      // BE 응답 code 로 분기 — 같은 429 라도 RATE_LIMIT (IP) vs
      // AUTH_ACCOUNT_LOCKED (계정 잠금) 안내 다름.
      if (isAxiosError(err)) {
        const data = err.response?.data as
          | { code?: string; message?: string }
          | undefined;
        if (data?.code === 'AUTH_ACCOUNT_LOCKED') {
          setAccountLocked(true);
          setError('root', { message: t('accountLocked') });
          return;
        }
        if (data?.code === 'RATE_LIMIT') {
          setError('root', { message: t('rateLimit') });
          return;
        }
        const message = data?.message ?? t('failed');
        setError('root', { message });
        return;
      }
      setError('root', { message: t('unknown') });
    }
  });

  return (
    <form onSubmit={onSubmit} className={styles.loginForm} noValidate>
      {/* Figma `logo` — 마크 40 + 브랜드명(20 Bold) + 태그라인(14), 아래 여백 40.
          시안에는 "로그인" 제목이 없다 — h1 은 스크린리더용으로만 남긴다. */}
      <h1 className={styles.srOnlyTitle}>{t('title')}</h1>
      <div className={styles.brand}>
        <LogoMark size={40} />
        <p className={styles.brandName}>{tBrand('name')}</p>
        <p className={styles.brandTagline}>{tBrand('tagline')}</p>
      </div>

      {/* Figma `fields` — 필드 사이 gap 16, 버튼과의 간격 24 */}
      <div className={styles.fields}>
        {FIELDS.map((f) => (
          <TextField
            key={f.name}
            id={f.name}
            type={f.type}
            autoComplete={f.autoComplete}
            label={t(f.name)}
            // 비밀번호 필드에만 눈 토글 (Figma `eyeIcon`)
            passwordToggle={f.type === 'password'}
            errorMessage={
              errors[f.name]
                ? t(errors[f.name]?.message as Parameters<typeof t>[0])
                : undefined
            }
            {...register(f.name)}
          />
        ))}
      </div>

      {errors.root && (
        <div role="alert" className={styles.error}>
          <p>{errors.root.message}</p>
          {accountLocked && (
            <Link href="/forgot-password" className={styles.errorLink}>
              {t('forgotPasswordCta')}
            </Link>
          )}
        </div>
      )}

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

      {/* Figma `links` — 가운데 정렬, 2px 점으로 구분한 12px 링크 3개.
          시안은 세 링크 모두 같은 톤(#151515)이다. */}
      <nav className={styles.links} aria-label={t('title')}>
        <Link href="/signup" className={styles.link}>
          {t('toSignup')}
        </Link>
        <span className={styles.linkDot} aria-hidden />
        <Link href="/find-id" className={styles.link}>
          {t('toFindId')}
        </Link>
        <span className={styles.linkDot} aria-hidden />
        <Link href="/forgot-password" className={styles.link}>
          {t('toForgot')}
        </Link>
      </nav>
    </form>
  );
}
