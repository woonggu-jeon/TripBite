'use client';

import { useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { MapPin } from 'lucide-react';
import {
  letterSchema,
  type LetterFormValues,
} from '@/features/letter/schemas/letter';
import { graphemeLength } from '@/lib/validation';
import { useSendLetter } from '@/features/letter/hooks/use-letters';
import { useLetterStore } from '@/features/letter/store/letter-store';
import { useResolveLocation, usePermissionState } from '@/features/location';
import { useLocationStore } from '@/stores/location-store';
import { useUIStore } from '@/stores/ui-store';
import { Button } from '@/components/ui';
import { haptic } from '@/lib/haptic';
import { PinLikeInput } from './PinLikeInput';
import styles from './LetterComposeForm.module.scss';

/**
 * 편지 작성 폼
 *
 * 구성:
 *   1) 상단 알림 문구 (info)
 *   2) PIN 코드 형식 5칸 시각 + 단일 input
 *      · 1~5자 (zod schema), 띄어쓰기/특수문자/이모지 허용
 *      · 한국어 IME 안전 (5칸 분리 input 대신 1개 input + 시각)
 *      · inputMode="text" — 모바일 일반 키패드
 *   3) 하단 현재 위치 노출 (location store + 권한 prompt)
 *   4) 또 쓰기 / 편지 보내기 두 버튼
 *      · 또 쓰기 = 입력 초기화 (form.reset)
 *      · 편지 보내기 → store.setLastSent + /letter/sent 이동
 */
export function LetterComposeForm() {
  const t = useTranslations('letter.compose');
  const tErr = useTranslations('letter.compose.errors');
  const tLoc = useTranslations('location');
  const router = useRouter();
  const { mutateAsync: send } = useSendLetter();
  const setLastSent = useLetterStore((s) => s.setLastSent);

  const permission = usePermissionState();
  const { resolve, isLoading: isResolving } = useResolveLocation();
  const resolved = useLocationStore((s) => s.resolved);
  const setResolved = useLocationStore((s) => s.setResolved);
  const pushToast = useUIStore((s) => s.pushToast);
  const autoTriggered = useRef(false);

  // 1차 자동 resolve — granted 일 때 즉시, prompt/unsupported 도 시도(브라우저 native prompt 띄움)
  // store 에 이미 있으면 skip. 컴포넌트 mount 당 1회만.
  useEffect(() => {
    if (resolved || autoTriggered.current) return;
    if (permission === 'denied') return; // denied 는 사용자 명시 클릭 필요
    autoTriggered.current = true;
    void resolve().then((r) => {
      if (r) setResolved(r);
    });
  }, [permission, resolved, resolve, setResolved]);

  const handleRequestLocation = async () => {
    haptic.tap();
    const r = await resolve();
    if (r) setResolved(r);
  };

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { isSubmitting },
  } = useForm<LetterFormValues>({
    resolver: zodResolver(letterSchema),
    defaultValues: { body: '' },
    // 'onSubmit' — 입력 중 인라인 에러 미표시. submit 시점에 검증 + toast 안내.
    mode: 'onSubmit',
  });

  const body = watch('body') ?? '';
  const count = graphemeLength(body);

  const onSubmit = handleSubmit(
    async (values) => {
      // 위치 권한 필수 — onboarding 에선 skip 가능하지만 편지 보낼 땐 필수.
      // disabled 가 막지만 DevTools 우회 안전망으로 한 번 더 검증.
      if (!resolved) {
        haptic.tap();
        pushToast({
          type: 'warning',
          message: tErr('locationRequired'),
          duration: 2500,
        });
        return;
      }
      haptic.success();
      await send({
        ...values,
        location: {
          label: resolved.label,
          regionCode: resolved.regionCode,
          latitude: resolved.latitude,
          longitude: resolved.longitude,
        },
      });
      setLastSent({
        body: values.body,
        location: { label: resolved.label, regionCode: resolved.regionCode },
        sentAt: new Date().toISOString(),
      });
      router.push('/letter/sent');
    },
    // invalid submit — 인라인 에러 대신 toast 로 안내. 첫 에러 메시지만 표시.
    (formErrors) => {
      haptic.tap();
      const first = formErrors.body?.message;
      if (first) {
        pushToast({
          type: 'warning',
          message: tErr(first as Parameters<typeof tErr>[0]),
          duration: 2500,
        });
      }
    },
  );

  const handleReset = () => {
    haptic.tap();
    reset({ body: '' });
  };

  // 정상 UX: 빈 입력 또는 위치 미허용 시 보내기 버튼 disabled.
  //   - graphemeLength 로 1~5자 검증
  //   - resolved !== null (위치 허용 또는 IP fallback)
  // onSubmit 의 invalid 콜백 / 위치 가드는 DevTools 우회 안전망.
  const canSubmit = count > 0 && count <= 5 && resolved !== null;

  return (
    <form onSubmit={onSubmit} className={styles.form}>
      {/* 1) 편지 내용 라벨 + PIN 5칸 입력 + 우측 하단 카운터 */}
      <div className={styles.inputSection}>
        <label htmlFor="body" className={styles.label}>
          {t('label')}
        </label>
        <Controller
          name="body"
          control={control}
          render={({ field }) => (
            <PinLikeInput
              id="body"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
              placeholder={t('placeholder')}
              aria-label={t('placeholder')}
            />
          )}
        />
        <div className={styles.countRow}>
          <span className={styles.count} aria-live="polite">
            {count} / 5
          </span>
        </div>
        {/* 인라인 에러 메시지 제거 — 보내기 버튼 클릭 시 toast 로 안내.
            disabled 자체는 시각적으로 dim 처리해 빈 상태를 명확히 표시. */}
      </div>

      {/* 3) 하단 위치 — 2줄 안내 (자동 첨부 + 지역) */}
      <div className={styles.locationSection}>
        <MapPin size={16} aria-hidden className={styles.locationIcon} />
        <div className={styles.locationBody}>
          {resolved ? (
            <>
              <p className={styles.locationLine1}>{tLoc('autoAttached')}</p>
              <p className={styles.locationLine2}>
                {resolved.label}{' '}
                <span className={styles.locationTag}>{tLoc('autoSet')}</span>
              </p>
            </>
          ) : isResolving ? (
            <p className={styles.locationLine1}>{tLoc('resolving')}</p>
          ) : permission === 'denied' ? (
            <p className={styles.locationLine1}>{tLoc('permission.denied')}</p>
          ) : (
            <>
              <p className={styles.locationLine1}>
                {tLoc('permission.needed')}
              </p>
              <button
                type="button"
                className={styles.allowBtn}
                onClick={handleRequestLocation}
              >
                {tLoc('permission.request')}
              </button>
            </>
          )}
        </div>
      </div>

      {/* 4) 액션 — 보내기 버튼은 빈 입력 시 disabled.
              인라인 에러는 표시 안 함 (시각적 중복). DevTools 등으로 disabled
              를 우회해 클릭한 경우는 onSubmit 의 invalid 콜백이 toast 로 안내. */}
      <div className={styles.actions}>
        <Button
          variant="secondary"
          fullWidth
          onClick={handleReset}
          disabled={isSubmitting || body.length === 0}
        >
          {t('reset')}
        </Button>
        <Button
          type="submit"
          variant="primary"
          fullWidth
          disabled={isSubmitting || !canSubmit}
          loading={isSubmitting}
        >
          {isSubmitting ? t('submitting') : t('submit')}
        </Button>
      </div>
    </form>
  );
}
