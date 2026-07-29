'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, PasswordField, TextField } from '@/components/ui';
import { authApi } from '@/features/auth/api/auth';
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
      name: '',
      birthDate: '',
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
    } catch (err) {
      setUsernameStatus('idle');
      if (isAxiosError(err) && err.response?.status === 429) {
        toast.error(tErr('rateLimit'));
      }
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
    } catch (err) {
      setEmailStatus('idle');
      if (isAxiosError(err) && err.response?.status === 429) {
        toast.error(tErr('rateLimit'));
      }
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
  // checking/available 시 hint X — 그 상태는 버튼 자체가 표현 (spinner / 확인 완료).
  const usernameValidShape = USERNAME_REGEX.test(usernameValue);
  const usernameHint =
    !usernameError && usernameStatus === 'idle' && usernameValidShape
      ? t('usernameCheckPrompt')
      : undefined;
  const emailError = errors.email
    ? tErr(errors.email.message as Parameters<typeof tErr>[0])
    : emailStatus === 'taken'
      ? tErr('emailTaken')
      : emailStatus === 'invalid'
        ? tErr('emailInvalid')
        : undefined;
  const emailValidShape = EMAIL_LIKE_REGEX.test(emailValue);
  const emailHint =
    !emailError && emailStatus === 'idle' && emailValidShape
      ? t('emailCheckPrompt')
      : undefined;

  const allFilled =
    !!usernameValue &&
    !!watch('name') &&
    !!watch('birthDate') &&
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
    <form
      onSubmit={onSubmit}
      noValidate
      className={`${styles.form} ${styles.formSignup}`}
    >
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
            disabled={
              usernameStatus === 'checking' ||
              usernameStatus === 'available' ||
              !USERNAME_REGEX.test(usernameValue)
            }
            onClick={handleCheckUsername}
            className={
              usernameStatus === 'available' ? styles.verifiedButton : undefined
            }
            leadingIcon={
              usernameStatus === 'checking' ? (
                <Loader2
                  size={14}
                  className={styles.checkSpinner}
                  aria-hidden
                />
              ) : usernameStatus === 'available' ? (
                <Check size={14} aria-hidden />
              ) : undefined
            }
          >
            {usernameStatus === 'checking'
              ? ''
              : usernameStatus === 'available'
                ? t('checkDone')
                : t('checkButton')}
          </Button>
        }
        {...register('username', { onChange: onUsernameInputChange })}
      />

      {/* Figma "AUTH · 회원가입" input 순서 정합 (2026-06-24 사용자 명시):
          username → password → passwordConfirm → nickname → email. */}
      <PasswordField
        id="password"
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

      <PasswordField
        id="passwordConfirm"
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

      {/* 신규 Spring BE SignupRequestDto: name(실명)·birthDate(생년월일) 필수. */}
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
            disabled={
              emailStatus === 'checking' ||
              emailStatus === 'available' ||
              !EMAIL_LIKE_REGEX.test(emailValue)
            }
            onClick={handleCheckEmail}
            className={
              emailStatus === 'available' ? styles.verifiedButton : undefined
            }
            leadingIcon={
              emailStatus === 'checking' ? (
                <Loader2
                  size={14}
                  className={styles.checkSpinner}
                  aria-hidden
                />
              ) : emailStatus === 'available' ? (
                <Check size={14} aria-hidden />
              ) : undefined
            }
          >
            {emailStatus === 'checking'
              ? ''
              : emailStatus === 'available'
                ? t('checkDone')
                : t('checkButton')}
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
        className={styles.submit}
      >
        {isSubmitting ? t('submitting') : t('submit')}
      </Button>

      {/* Figma "AUTH · 회원가입 Frame 69" — "이미 계정이 있나요?" R_14 fg + dot 2×2 +
          "로그인" B_14 primary (사용자 명시 2026-06-24). 단일 link 텍스트 → row + 강조. */}
      <div className={styles.toLoginRow}>
        <span className={styles.toLoginPrompt}>{t('toLoginPrompt')}</span>
        <span className={styles.footDot} aria-hidden />
        <Link href="/login" className={styles.toLoginAction}>
          {t('toLoginAction')}
        </Link>
      </div>
    </form>
  );
}
