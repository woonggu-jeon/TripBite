'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Icon } from '@/components/icon/Icon';
import { Button } from '@/components/ui';
import { track } from '@/features/analytics';
import { useSendLetter } from '@/features/letter/hooks/use-letters';
import {
  type LetterFormValues,
  letterSchema,
} from '@/features/letter/schemas/letter';
import { useLetterStore } from '@/features/letter/store/letter-store';
import { usePermissionState, useResolveLocation } from '@/features/location';
import { haptic } from '@/lib/haptic';
import { graphemeLength } from '@/lib/validation';
import { useLocationStore } from '@/stores/location-store';
import { useUIStore } from '@/stores/ui-store';
import styles from './LetterComposeForm.module.scss';
import { PinLikeInput } from './PinLikeInput';

/**
 * 편지 작성 폼 — Figma "편지 쓰기" (2026-06-24) 정합.
 *
 * 구조 (Frame 76 column gap 32):
 *   - Frame 1 (intro center): title B_24 fg + sub R_14 muted.
 *   - Frame 73 (gap 8): Frame 79 (input wrap bg #F8F8F8 border 1px gray radius
 *     12 padding 20) + Frame 72 (count "X/5" right B_10 primary).
 *   - Frame 75 (column gap 20): an (체크박스 + label) + loc (위치 카드 row).
 *   - button absolute bottom 20 — 단일 "편지 보내기" 320×52 primary.
 *
 * "또 쓰기" 버튼 폐기 (Figma 정합 — 단일 submit). 입력 reset 은 사용자 명시 시
 * 추가 가능.
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

  useEffect(() => {
    if (resolved || autoTriggered.current) return;
    if (permission === 'denied') return;
    autoTriggered.current = true;
    void resolve()
      .then((r) => {
        if (r) setResolved(r);
      })
      .catch(() => {});
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
    formState: { isSubmitting },
  } = useForm<LetterFormValues>({
    resolver: zodResolver(letterSchema),
    defaultValues: { body: '', isAnonymous: false },
    mode: 'onSubmit',
  });

  const body = watch('body') ?? '';
  const count = graphemeLength(body);

  const onSubmit = handleSubmit(
    async (values) => {
      // BE 계약: location.regionCode(충북 시군) 필수 non-null. reverse-geocode 가
      // regionCode 를 못 주면(충북 밖/실패) 편지를 놓을 수 없음 → 전송 차단.
      if (!resolved || !resolved.regionCode) {
        haptic.tap();
        pushToast({
          type: 'warning',
          message: tErr('locationRequired'),
        });
        return;
      }
      haptic.success();
      let created;
      try {
        created = await send({
          body: values.body,
          isAnonymous: values.isAnonymous,
          location: {
            regionCode: resolved.regionCode,
            label: resolved.label,
            latitude: resolved.latitude,
            longitude: resolved.longitude,
          },
        });
      } catch {
        haptic.tap();
        pushToast({
          type: 'error',
          message: tErr('sendFailed'),
          duration: 3000,
        });
        return;
      }
      setLastSent({
        body: values.body,
        location: { label: resolved.label },
        sentAt: created?.createdAt ?? new Date().toISOString(),
        isAnonymous: values.isAnonymous,
      });
      track('letter.sent', { length: graphemeLength(values.body) });
      router.push(
        created?.id
          ? `/letter/sent?id=${encodeURIComponent(created.id)}`
          : '/letter/sent',
      );
    },
    (formErrors) => {
      haptic.warning();
      const first = formErrors.body?.message;
      if (first) {
        pushToast({
          type: 'warning',
          message: tErr(first as Parameters<typeof tErr>[0]),
        });
      }
    },
  );

  const canSubmit = count > 0 && count <= 5 && resolved !== null;

  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <div className={styles.wb}>
        {/* Figma Frame 1 — intro (title B_24 + sub R_14 muted center). SubHeader
            title 은 "편지 쓰기" (page.tsx 의 letter.compose.title), body hero
            는 별도 heroTitle 키 — 둘이 분리 (사용자 명시 2026-06-24). */}
        <div className={styles.intro}>
          <h1 className={styles.title}>{t('heroTitle')}</h1>
          <p className={styles.sub}>{t('intro')}</p>
        </div>

        {/* Figma Frame 73 — input wrap + count. */}
        <div className={styles.inputBlock}>
          <div className={styles.inputWrap}>
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
                  aria-label={t('placeholder')}
                />
              )}
            />
          </div>
          <div className={styles.countRow}>
            {/* "X/5" — current 강조 (primary), max 약화 (disabled). Figma single
                spec 의 정확한 정합 + UX 표준 split (사용자 명시 2026-06-24). */}
            <span className={styles.count} aria-live="polite">
              <span className={styles.countCurrent}>{count}</span>
              <span className={styles.countMax}>/5</span>
            </span>
          </div>
        </div>

        {/* Figma Frame 75 — anonymous checkbox + location card. */}
        <div className={styles.bottomBlock}>
          <Controller
            name="isAnonymous"
            control={control}
            render={({ field }) => (
              <label htmlFor="isAnonymous" className={styles.anon}>
                <input
                  id="isAnonymous"
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  onBlur={field.onBlur}
                  name={field.name}
                  className={styles.anonNative}
                />
                <Icon
                  name={field.value ? 'checkbox-on' : 'checkbox-off'}
                  size={20}
                />
                <span className={styles.anonLabel}>{t('anonymous')}</span>
              </label>
            )}
          />

          {/* Figma loc — 320×81 padding 20 16 white + 1px gray border + radius
              12 row. MapPin 20 primary + lm (column gap 3 — caption 위치명 +
              B_14 fg 라벨) + lbg pill primary-soft "위치 첨부". */}
          <div className={styles.locCard}>
            <Icon name="location" size={20} className={styles.locIcon} />
            <div className={styles.locMid}>
              {resolved ? (
                <>
                  {/* Figma loc: caption (위) "현재 위치가 자동으로 첨부돼요" +
                      label (아래, 강조) "{지역명}" — 위치 변경 (사용자 명시
                      2026-06-24). 직전엔 지역명 → 안내 순서 였음. */}
                  <span className={styles.locSub}>{tLoc('autoAttached')}</span>
                  <span className={styles.locLabel}>{resolved.label}</span>
                </>
              ) : isResolving ? (
                <span className={styles.locSub}>{tLoc('resolving')}</span>
              ) : permission === 'denied' ? (
                <span className={styles.locSub}>
                  {tLoc('permission.denied')}
                </span>
              ) : (
                <>
                  <span className={styles.locSub}>
                    {tLoc('permission.needed')}
                  </span>
                  <button
                    type="button"
                    className={styles.locAllow}
                    onClick={handleRequestLocation}
                  >
                    {tLoc('permission.request')}
                  </button>
                </>
              )}
            </div>
            {resolved && (
              <span className={styles.locPill}>{tLoc('autoSet')}</span>
            )}
          </div>
        </div>
      </div>

      {/* Figma button — absolute bottom 20, 320×52 primary radius 12 M_16 white. */}
      <div className={styles.actions}>
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
