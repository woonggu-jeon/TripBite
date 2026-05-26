'use client';

import { useTranslations } from 'next-intl';
import type { FieldValues, UseFormSetError, Path } from 'react-hook-form';
import { isAxiosError } from '@/services/interceptors/auth';

/**
 * 폼 에러 처리 공통 훅
 *
 * 사용:
 *   const t = useTranslations();
 *   const { setError } = useForm();
 *   const onError = useFormError(setError, 'auth.login');
 *   mutate(values, { onError });
 *
 * 동작:
 *   - axios 에러:
 *     · 4xx → 백엔드가 보낸 message 우선, 없으면 i18n fallback (`${ns}.failed`)
 *     · 5xx / 네트워크 → i18n (`errors.tryAgainLater`)
 *   - 그 외 → i18n (`auth.login.unknown` 또는 `errors.generic`)
 *   - 필드별 에러 (`{ errors: { email: '...' } }`) 형태면 각 필드에 setError
 *
 * 백엔드 응답 컨벤션:
 *   { message: string, code?: string, fieldErrors?: Record<string, string> }
 */
export function useFormError<T extends FieldValues>(
  setError: UseFormSetError<T>,
  namespace: string,
) {
  const t = useTranslations();

  return function onError(err: unknown) {
    if (isAxiosError(err)) {
      const data = err.response?.data as
        | { message?: string; fieldErrors?: Record<string, string> }
        | undefined;
      const status = err.response?.status ?? 0;

      // 필드별 에러 매핑
      if (data?.fieldErrors) {
        for (const [field, msg] of Object.entries(data.fieldErrors)) {
          setError(field as Path<T>, { type: 'server', message: msg });
        }
      }

      // 루트 에러
      let message: string;
      if (status >= 500 || status === 0) {
        message = t('errors.tryAgainLater');
      } else if (data?.message) {
        message = data.message;
      } else {
        // i18n key — `${namespace}.failed` 가 존재한다고 가정
        // 안전하게 try/catch — 키 없으면 generic fallback
        try {
          message = t(`${namespace}.failed` as Parameters<typeof t>[0]);
        } catch {
          message = t('errors.generic');
        }
      }
      setError('root' as Path<T>, { type: 'server', message });
      return;
    }

    // 알 수 없는 에러
    setError('root' as Path<T>, {
      type: 'unknown',
      message: t('errors.generic'),
    });
  };
}
