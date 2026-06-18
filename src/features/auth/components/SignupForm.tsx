'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useSignup } from '@/features/auth/hooks/use-auth';
import { authApi } from '@/features/auth/api/auth';
import {
  signupSchema,
  type SignupFormValues,
} from '@/features/auth/schemas/signup';
import { isAxiosError } from '@/services/interceptors/auth';
import { Button, TextField } from '@/components/ui';
import styles from './AuthForm.module.scss';

/**
 * 회원가입 폼 — 4 필수 + 비번 확인.
 *
 *   username (영문/숫자 4-20자) + 중복확인 버튼
 *   nickname (한글/영문/숫자 2-10자)
 *   password (영문+숫자+특문 10-72자)
 *   passwordConfirm
 *   email + 중복확인 버튼 (BE check-email 신설 대기 — 임시 disabled)
 *
 * submit disabled:
 *   - 5 필드 중 하나라도 입력 X (필수값 정책)
 *   - username 중복확인 미완 또는 'taken'
 *   - (이메일 중복확인 미완 — BE 준비 후 활성)
 *
 * 헬퍼텍스트 정책:
 *   - 입력 안 함 → 필드별 placeholder
 *   - 검증 통과 + 미확인 → "중복확인을 해주세요"
 *   - 확인 중 → "확인 중..."
 *   - 사용 가능 → "사용 가능한 OO예요"
 *   - 이미 사용 → "이미 사용 중이에요"
 */

type CheckStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

const USERNAME_REGEX = /^[a-zA-Z0-9]{4,20}$/;
// 간이 이메일 형식 — check-email 버튼 enable 조건. 정밀 검증은 zod 가 담당.
const EMAIL_LIKE_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
      nickname: '',
      password: '',
      passwordConfirm: '',
      email: '',
    },
  });

  // 중복확인 — 버튼 클릭 방식. 사용자 입력 변경 시 status reset (재확인 필수).
  const [usernameStatus, setUsernameStatus] = useState<CheckStatus>('idle');
  const [emailStatus, setEmailStatus] = useState<CheckStatus>('idle');
  const usernameValue = watch('username');
  const emailValue = watch('email');

  // 입력 변경 시 verified 상태 무효화 (재확인 필요)
  const onUsernameInputChange = () => {
    if (usernameStatus !== 'idle') setUsernameStatus('idle');
  };
  const onEmailInputChange = () => {
    if (emailStatus !== 'idle') setEmailStatus('idle');
  };

  const handleCheckUsername = async () => {
    if (!USERNAME_REGEX.test(usernameValue)) {
      setUsernameStatus('invalid');
      return;
    }
    setUsernameStatus('checking');
    try {
      const res = await authApi.checkUsername(usernameValue);
      setUsernameStatus(res.available ? 'available' : 'taken');
    } catch {
      setUsernameStatus('idle');
    }
  };

  const handleCheckEmail = async () => {
    if (!EMAIL_LIKE_REGEX.test(emailValue)) {
      setEmailStatus('invalid');
      return;
    }
    setEmailStatus('checking');
    try {
      const res = await authApi.checkEmail(emailValue);
      setEmailStatus(res.available ? 'available' : 'taken');
    } catch {
      setEmailStatus('idle');
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    if (usernameStatus !== 'available') {
      setError('username', { message: 'usernameVerifyRequired' });
      return;
    }
    if (emailStatus !== 'available') {
      setError('email', { message: 'emailVerifyRequired' });
      return;
    }
    try {
      const { passwordConfirm: _unused, ...payload } = values;
      void _unused;
      await signup(payload);
    } catch (err) {
      // BE 가 가입 시점 최종 차단 (사용자가 중복확인 후 누군가 같은 id/email 로
      // 선점한 race) — code 로 분기해 정확한 필드에 인라인 에러.
      const code = extractErrorCode(err);
      if (code === 'AUTH_USERNAME_TAKEN') {
        setUsernameStatus('taken');
        setError('username', { message: 'usernameTaken' });
        return;
      }
      if (code === 'AUTH_EMAIL_TAKEN') {
        setEmailStatus('taken');
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

  // 메시지 우선순위: zod errors > check status taken/invalid > hint (idle/checking/available).
  // taken/invalid 는 hint 가 아니라 errorMessage 로 빨간색 노출 (사용자 명확 인지).
  const usernameError = errors.username
    ? tErr(errors.username.message as Parameters<typeof tErr>[0])
    : usernameStatus === 'taken'
      ? tErr('usernameTaken')
      : usernameStatus === 'invalid'
        ? tErr('usernameInvalid')
        : undefined;
  // pattern 통과한 값이 입력됐을 때만 idle 안내 ("중복확인을 해주세요") 노출.
  // 빈 값/regex 미통과면 placeholder 만 보이고 hint X.
  const usernameValidShape = USERNAME_REGEX.test(usernameValue);
  const usernameHint =
    !usernameError &&
    renderHint({
      status: usernameStatus,
      t,
      field: 'username',
      showIdle: usernameValidShape,
    });
  const emailError = errors.email
    ? tErr(errors.email.message as Parameters<typeof tErr>[0])
    : emailStatus === 'taken'
      ? tErr('emailTaken')
      : emailStatus === 'invalid'
        ? tErr('emailInvalid')
        : undefined;
  const emailValidShape = EMAIL_LIKE_REGEX.test(emailValue);
  const emailHint =
    !emailError &&
    renderHint({
      status: emailStatus,
      t,
      field: 'email',
      showIdle: emailValidShape,
    });

  const allFilled =
    !!usernameValue &&
    !!watch('nickname') &&
    !!watch('password') &&
    !!watch('passwordConfirm') &&
    !!emailValue;

  // submit 가능 조건: 5 필드 입력 + zod valid + username/email 둘 다 'available'.
  const submitDisabled =
    isSubmitting ||
    !allFilled ||
    !isValid ||
    usernameStatus !== 'available' ||
    emailStatus !== 'available';

  return (
    <form onSubmit={onSubmit} noValidate className={styles.form}>
      <h1 className={styles.title}>{t('title')}</h1>

      <TextField
        id="username"
        type="text"
        autoComplete="username"
        label={t('username')}
        placeholder={t('usernamePlaceholder')}
        errorMessage={usernameError}
        hint={usernameHint || undefined}
        suffix={
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={usernameStatus === 'checking'}
            disabled={
              usernameStatus === 'checking' ||
              usernameStatus === 'available' ||
              !USERNAME_REGEX.test(usernameValue)
            }
            onClick={handleCheckUsername}
          >
            {t('checkButton')}
          </Button>
        }
        {...register('username', { onChange: onUsernameInputChange })}
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
        {...register('passwordConfirm')}
      />

      <TextField
        id="email"
        type="email"
        autoComplete="email"
        label={t('email')}
        placeholder={t('emailPlaceholder')}
        errorMessage={emailError}
        hint={emailHint || undefined}
        suffix={
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={emailStatus === 'checking'}
            disabled={
              emailStatus === 'checking' ||
              emailStatus === 'available' ||
              !EMAIL_LIKE_REGEX.test(emailValue)
            }
            onClick={handleCheckEmail}
          >
            {t('checkButton')}
          </Button>
        }
        {...register('email', { onChange: onEmailInputChange })}
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

      <Link href="/login" className={styles.footCenter}>
        {t('toLogin')}
      </Link>
    </form>
  );
}

function renderHint({
  status,
  t,
  field,
  showIdle,
}: {
  status: CheckStatus;
  t: (k: string) => string;
  field: 'username' | 'email';
  /** idle 안내 표시 여부 — 값이 pattern 통과한 후에만 true. */
  showIdle: boolean;
}): ReactNode {
  if (status === 'checking') return t(`${field}Checking`);
  if (status === 'available') return t(`${field}Available`);
  if (status === 'idle' && showIdle) return t(`${field}CheckPrompt`);
  return undefined;
}
