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
    // BE check-email endpoint 신설 후 활성 (docs/BE_REQUEST_auth_check_email.md §1)
    // 현재는 버튼 disabled — signup 시 409 AUTH_EMAIL_TAKEN 으로 처리.
  };

  const onSubmit = handleSubmit(async (values) => {
    if (usernameStatus !== 'available') {
      setError('username', { message: 'usernameVerifyRequired' });
      return;
    }
    try {
      const { passwordConfirm: _unused, ...payload } = values;
      void _unused;
      await signup(payload);
    } catch (err) {
      const message = isAxiosError(err)
        ? ((err.response?.data as { message?: string })?.message ?? t('failed'))
        : t('failed');
      setError('root', { message });
    }
  });

  const usernameHint = renderHint({
    status: usernameStatus,
    t,
    field: 'username',
  });
  const emailHint = renderHint({
    status: emailStatus,
    t,
    field: 'email',
    extra: t('emailCheckPending'),
  });

  const allFilled =
    !!usernameValue &&
    !!watch('nickname') &&
    !!watch('password') &&
    !!watch('passwordConfirm') &&
    !!emailValue;

  // submit 가능 조건: 5 필드 입력 + zod valid + username 'available'.
  // 이메일 'available' 조건은 BE check-email 준비 후 추가.
  const submitDisabled =
    isSubmitting || !allFilled || !isValid || usernameStatus !== 'available';

  return (
    <form onSubmit={onSubmit} noValidate className={styles.form}>
      <h1 className={styles.title}>{t('title')}</h1>

      <FieldWithCheck
        id="username"
        type="text"
        autoComplete="username"
        label={t('username')}
        placeholder={t('usernamePlaceholder')}
        errorMessage={
          errors.username
            ? tErr(errors.username.message as Parameters<typeof tErr>[0])
            : undefined
        }
        hint={usernameHint}
        {...register('username', { onChange: onUsernameInputChange })}
        checkLabel={t('checkButton')}
        checkPending={usernameStatus === 'checking'}
        checkDisabled={
          usernameStatus === 'checking' ||
          usernameStatus === 'available' ||
          !USERNAME_REGEX.test(usernameValue)
        }
        onCheckClick={handleCheckUsername}
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

      <FieldWithCheck
        id="email"
        type="email"
        autoComplete="email"
        label={t('email')}
        placeholder={t('emailPlaceholder')}
        errorMessage={
          errors.email
            ? tErr(errors.email.message as Parameters<typeof tErr>[0])
            : undefined
        }
        hint={emailHint}
        {...register('email', { onChange: onEmailInputChange })}
        checkLabel={t('checkButton')}
        checkPending={emailStatus === 'checking'}
        checkDisabled // BE check-email 대기 — 항상 disabled
        onCheckClick={handleCheckEmail}
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

/**
 * TextField + 우측 "중복확인" 버튼 인라인. RHF register 결과 그대로 input 에 전달.
 */
type FieldWithCheckProps = React.ComponentProps<typeof TextField> & {
  checkLabel: string;
  checkPending: boolean;
  checkDisabled: boolean;
  onCheckClick: () => void;
};

function FieldWithCheck({
  checkLabel,
  checkPending,
  checkDisabled,
  onCheckClick,
  ...textFieldProps
}: FieldWithCheckProps) {
  return (
    <div className={styles.fieldWithCheck}>
      <TextField {...textFieldProps} />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        loading={checkPending}
        disabled={checkDisabled}
        onClick={onCheckClick}
        className={styles.checkButton}
      >
        {checkLabel}
      </Button>
    </div>
  );
}

function renderHint({
  status,
  t,
  field,
  extra,
}: {
  status: CheckStatus;
  t: (k: string) => string;
  field: 'username' | 'email';
  extra?: string;
}): ReactNode {
  if (status === 'checking') return t(`${field}Checking`);
  if (status === 'available') return t(`${field}Available`);
  if (status === 'idle') return extra ?? t(`${field}CheckPrompt`);
  return undefined;
}
