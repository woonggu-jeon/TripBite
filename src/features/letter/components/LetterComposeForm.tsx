'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  letterSchema,
  graphemeLength,
  type LetterFormValues,
} from '@/features/letter/schemas/letter';
import { useSendLetter } from '@/features/letter/hooks/use-letters';
import {
  LocationPermissionPrompt,
  useResolveLocation,
  usePermissionState,
} from '@/features/location';
import { useLocationStore } from '@/stores/location-store';

/**
 * 편지 작성 폼
 *
 * - 5글자 이하 입력 (zod 검증)
 * - 보낸 위치 자동 채우기:
 *   1) location-store에 이미 resolve된 좌표가 있으면 그대로 표시
 *   2) 없으면:
 *      · permission='granted' → mount 직후 자동 resolve (prompt 안 뜸)
 *      · 그 외 → LocationPermissionPrompt 노출, 사용자가 명시 클릭으로 resolve
 *   3) 거부/실패는 무해 — 위치 없이 보낼 수 있음 (백엔드가 IP fallback)
 *
 * 라벨/에러는 i18n 변환.
 */
export function LetterComposeForm() {
  const t = useTranslations('letter.compose');
  const tErr = useTranslations('letter.compose.errors');
  const tLoc = useTranslations('location');
  const router = useRouter();
  const { mutateAsync: send } = useSendLetter();

  const permission = usePermissionState();
  const { resolve, isLoading: isResolving } = useResolveLocation();
  const resolved = useLocationStore((s) => s.resolved);
  const setResolved = useLocationStore((s) => s.setResolved);
  const clearResolved = useLocationStore((s) => s.clear);
  const grantedAutoTriggered = useRef(false);
  const [locationDismissed, setLocationDismissed] = useState(false);

  // granted인데 아직 store에 없으면 mount 직후 자동 resolve (prompt 안 뜸)
  useEffect(() => {
    if (resolved || permission !== 'granted' || grantedAutoTriggered.current) {
      return;
    }
    grantedAutoTriggered.current = true;
    void resolve().then((r) => {
      if (r) setResolved(r);
    });
  }, [permission, resolved, resolve, setResolved]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LetterFormValues>({
    resolver: zodResolver(letterSchema),
    defaultValues: { body: '' },
  });

  const body = watch('body') ?? '';
  const count = graphemeLength(body);

  const onSubmit = handleSubmit(async (values) => {
    await send({
      ...values,
      location: resolved
        ? {
            label: resolved.label,
            regionCode: resolved.regionCode,
            latitude: resolved.latitude,
            longitude: resolved.longitude,
          }
        : undefined,
    });
    router.replace('/letter');
  });

  async function handleAcceptLocation() {
    const r = await resolve();
    if (r) setResolved(r);
    else setLocationDismissed(true);
  }

  function handleSkipLocation() {
    setLocationDismissed(true);
  }

  // 위치 UI 분기
  const showPrompt =
    !resolved &&
    !locationDismissed &&
    (permission === 'prompt' || permission === 'unsupported');

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: '1rem' }}>
      {/* 위치 영역 */}
      {resolved ? (
        <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>
          {tLoc('current')}: {resolved.label}{' '}
          <button
            type="button"
            onClick={() => {
              clearResolved();
              setLocationDismissed(false);
              grantedAutoTriggered.current = false;
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary)',
              cursor: 'pointer',
              padding: 0,
              marginLeft: 4,
              fontSize: 'inherit',
            }}
          >
            · {tLoc('change')}
          </button>
        </p>
      ) : showPrompt ? (
        <LocationPermissionPrompt
          onAccept={handleAcceptLocation}
          onSkip={handleSkipLocation}
        />
      ) : isResolving ? (
        <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>
          {tLoc('resolving')}
        </p>
      ) : null}

      <div>
        <label htmlFor="body" style={{ fontSize: '0.875rem', fontWeight: 500 }}>
          {t('label', { count })}
        </label>
        <input
          id="body"
          type="text"
          maxLength={10}
          placeholder={t('placeholder')}
          style={{
            width: '100%',
            marginTop: 8,
            padding: '0.75rem',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            fontSize: '1.125rem',
            textAlign: 'center',
            letterSpacing: '0.5em',
          }}
          {...register('body')}
        />
        {errors.body && (
          <p
            style={{
              color: 'var(--color-danger)',
              fontSize: '0.8125rem',
              marginTop: 6,
            }}
          >
            {tErr(errors.body.message as Parameters<typeof tErr>[0])}
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
    </form>
  );
}
