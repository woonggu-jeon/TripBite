'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { Button, TextField } from '@/components/ui';
import { useSignup } from '@/features/auth/hooks/use-auth';
import {
  type SignupFormValues,
  signupSchema,
} from '@/features/auth/schemas/signup';
import { toast } from '@/lib/toast';
import { isAxiosError } from '@/services/interceptors/auth';
import styles from './AuthForm.module.scss';

/**
 * 회원가입 폼 — 4 필수 + 비번 확인.
 *
 *   username (영문/숫자 4-20자)
 *   nickname (한글/영문/숫자 2-10자)
 *   password (영문+숫자+특문 10-72자)
 *   passwordConfirm
 *   email
 *
 * 중복확인: Spring 미지원(/auth/check-username·check-email 없음) → 버튼은 남기되
 * "준비중" 안내. 중복 판정은 가입 제출 시 BE 409(AUTH_USERNAME_TAKEN /
 * AUTH_EMAIL_TAKEN)로 처리 → 정확한 필드에 인라인 에러.
 *
 * submit disabled: 5 필드 입력 + zod valid (사전 중복확인 게이팅 제거).
 */

type BeErrorCode =
  | 'AUTH_USERNAME_TAKEN'
  | 'AUTH_EMAIL_TAKEN'
  | 'AUTH_PASSWORD_WEAK'
  | 'VALIDATION';

function extractErrorCode(err: unknown): BeErrorCode | null {
  if (!isAxiosError(err)) return null;
  const data = err.response?.data as { code?: string } | undefined;
  return (data?.code as BeErrorCode) ?? null;
}

export function SignupForm() {
  const t = useTranslations('auth.signup');
  const tErr = useTranslations('auth.signup.errors');
  const tComingSoon = useTranslations('common.comingSoon');
  const { mutateAsync: signup } = useSignup();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isValid },
    setError,
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange',
    defaultValues: {
      username: '',
      name: '',
      birthDate: '',
      nickname: '',
      password: '',
      passwordConfirm: '',
      email: '',
    },
  });

  const usernameValue = watch('username');
  const emailValue = watch('email');

  // BE-TODO(§5 P2-6): 중복확인 — Spring 미지원(GET /auth/check-username·check-email 없음)
  //   → 준비중 toast. 실제 중복은 가입 시 409 로 차단(기능 정상). 엔드포인트 추가 시
  //   인라인 사전확인 복원 가능(선택).
  const onCheckComingSoon = () => toast.info(tComingSoon('description'));

  const onSubmit = handleSubmit(async (values) => {
    try {
      const { passwordConfirm: _unused, ...payload } = values;
      void _unused;
      await signup(payload);
    } catch (err) {
      // BE 가 가입 시점 중복/약한 비번을 차단 — code 로 분기해 정확한 필드에 인라인 에러.
      const code = extractErrorCode(err);
      if (code === 'AUTH_USERNAME_TAKEN') {
        setError('username', { message: 'usernameTaken' });
        return;
      }
      if (code === 'AUTH_EMAIL_TAKEN') {
        setError('email', { message: 'emailTaken' });
        return;
      }
      if (code === 'AUTH_PASSWORD_WEAK') {
        setError('password', { message: 'passwordWeak' });
        return;
      }
      const message = isAxiosError(err)
        ? ((err.response?.data as { message?: string })?.message ?? t('failed'))
        : t('failed');
      setError('root', { message });
    }
  });

  const usernameError = errors.username
    ? tErr(errors.username.message as Parameters<typeof tErr>[0])
    : undefined;
  const emailError = errors.email
    ? tErr(errors.email.message as Parameters<typeof tErr>[0])
    : undefined;

  const allFilled =
    !!usernameValue &&
    !!watch('name') &&
    !!watch('birthDate') &&
    !!watch('nickname') &&
    !!watch('password') &&
    !!watch('passwordConfirm') &&
    !!emailValue;

  // submit 가능 조건: 5 필드 입력 + zod valid. (사전 중복확인 게이팅 제거 — 409로 처리.)
  const submitDisabled = isSubmitting || !allFilled || !isValid;

  // 중복확인 버튼(준비중) — 필드 우측 suffix. 클릭 시 준비중 toast.
  const checkButton = (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={onCheckComingSoon}
    >
      {t('checkButton')}
    </Button>
  );

  return (
    // Figma `AUTH · 회원가입` — 제목은 헤더가 갖고, body 는 필드 5개(gap 16)
    // → 버튼(gap 24) → "이미 계정이 있으신가요? · 로그인".
    <form onSubmit={onSubmit} noValidate className={styles.signupForm}>
      <TextField
        id="username"
        type="text"
        autoComplete="username"
        label={t('username')}
        placeholder={t('usernamePlaceholder')}
        errorMessage={usernameError}
        suffix={checkButton}
        {...register('username')}
      />

      <TextField
        id="name"
        type="text"
        autoComplete="name"
        label={t('name')}
        placeholder={t('namePlaceholder')}
        errorMessage={
          errors.name
            ? tErr(errors.name.message as Parameters<typeof tErr>[0])
            : undefined
        }
        {...register('name')}
      />

      <TextField
        id="birthDate"
        type="date"
        autoComplete="bday"
        label={t('birthDate')}
        placeholder={t('birthDatePlaceholder')}
        errorMessage={
          errors.birthDate
            ? tErr(errors.birthDate.message as Parameters<typeof tErr>[0])
            : undefined
        }
        {...register('birthDate')}
      />

      <TextField
        id="nickname"
        type="text"
        autoComplete="nickname"
        label={t('nickname')}
        placeholder={t('nicknamePlaceholder')}
        errorMessage={
          errors.nickname
            ? tErr(errors.nickname.message as Parameters<typeof tErr>[0])
            : undefined
        }
        {...register('nickname')}
      />

      <TextField
        id="password"
        type="password"
        autoComplete="new-password"
        label={t('password')}
        placeholder={t('passwordPlaceholder')}
        errorMessage={
          errors.password
            ? tErr(errors.password.message as Parameters<typeof tErr>[0])
            : undefined
        }
        passwordToggle
        {...register('password')}
      />

      <TextField
        id="passwordConfirm"
        type="password"
        autoComplete="new-password"
        label={t('passwordConfirm')}
        placeholder={t('passwordConfirmPlaceholder')}
        errorMessage={
          errors.passwordConfirm
            ? tErr(errors.passwordConfirm.message as Parameters<typeof tErr>[0])
            : undefined
        }
        passwordToggle
        {...register('passwordConfirm')}
      />

      <TextField
        id="email"
        type="email"
        autoComplete="email"
        label={t('email')}
        placeholder={t('emailPlaceholder')}
        errorMessage={emailError}
        suffix={checkButton}
        {...register('email')}
      />

      {errors.root && (
        <p className={styles.error} role="alert">
          {errors.root.message}
        </p>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={isSubmitting}
        disabled={submitDisabled}
      >
        {isSubmitting ? t('submitting') : t('submit')}
      </Button>

      {/* Figma `Frame 69` — 안내 문구 + 2px 점 + 초록 "로그인" 링크 */}
      <p className={styles.signupFoot}>
        {t('haveAccount')}
        <span className={styles.signupFootDot} aria-hidden />
        <Link href="/login" className={styles.signupFootLink}>
          {t('loginLink')}
        </Link>
      </p>
    </form>
  );
}
