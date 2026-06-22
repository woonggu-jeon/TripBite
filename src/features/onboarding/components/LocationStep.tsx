'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import {
  LocationPermissionPrompt,
  useResolveLocation,
  usePermissionState,
} from '@/features/location';
import { useLocationStore } from '@/stores/location-store';
import { track } from '@/features/analytics';
import { Button } from '@/components/ui';
import styles from './OnboardingStep.module.scss';

/**
 * <LocationStep /> — 온보딩 step 2
 *
 * 권한 상태별 분기:
 *   - 'granted'           : mount 시 자동 resolve (prompt 미발생)
 *   - 'prompt'/'unsupported': LocationPermissionPrompt → 사용자 클릭으로 resolve
 *   - 'denied'            : 안내 + 건너뛰기만 (브라우저가 prompt 차단)
 *
 * iOS 정책 — getCurrentPosition 은 사용자 액션 직후만. granted 상태의 mount-time
 * 호출은 prompt 가 안 떠서 위반 X. 그 외 상태는 버튼 클릭으로 트리거.
 *
 * UX — "허용" 클릭 → 브라우저 dialog → resolve (GPS + reverse geocode) → onNext
 * 까지 수백 ms ~ 수 초. 그 사이 `LocationPermissionPrompt` 그대로 두면 사용자가
 * "허용했는데 아무 반응 없음" 으로 느껴 어색. status === 'resolving' 또는
 * 'finishing' (= 부모의 mutation isPending) 동안은 spinner + "위치를 가져오는
 * 중..." 화면으로 prompt 를 교체.
 */
export function LocationStep({
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
}: {
  currentStep?: number;
  totalSteps?: number;
  onNext?: () => void | Promise<void>;
  onPrev?: () => void;
  onSkip?: () => void | Promise<void>;
}) {
  const t = useTranslations('location');
  const permission = usePermissionState();
  const { resolve, isLoading, error } = useResolveLocation();
  const setResolved = useLocationStore((s) => s.setResolved);
  const [status, setStatus] = useState<
    'idle' | 'resolving' | 'finishing' | 'resolved' | 'failed'
  >('idle');
  const grantedAutoTriggered = useRef(false);

  useEffect(() => {
    if (permission !== 'granted' || grantedAutoTriggered.current) return;
    grantedAutoTriggered.current = true;
    setStatus('resolving');
    void (async () => {
      const r = await resolve();
      if (r) {
        setResolved(r);
        track('onboarding.location_allowed');
        // mutation isPending 까지 spinner 유지 — finishing 으로 전환.
        setStatus('finishing');
        await onNext?.();
        setStatus('resolved');
      } else {
        setStatus('failed');
      }
    })();
  }, [permission, resolve, setResolved, onNext]);

  async function handleAccept() {
    setStatus('resolving');
    const r = await resolve();
    if (r) {
      setResolved(r);
      track('onboarding.location_allowed');
      setStatus('finishing');
      await onNext?.();
      setStatus('resolved');
    } else {
      track('onboarding.location_skipped');
      setStatus('failed');
      await (onSkip ?? onNext)?.();
    }
  }

  async function handleSkip() {
    track('onboarding.location_skipped');
    setStatus('finishing');
    await (onSkip ?? onNext)?.();
    setStatus('resolved');
  }

  // resolve 또는 finishOnboarding mutation 진행 중 — 권한 상태 무관 공통 화면.
  const isWorking =
    status === 'resolving' || status === 'finishing' || isLoading;
  if (isWorking) {
    return (
      <div className={`${styles.step} ${styles.resolving}`}>
        <Loader2 className={styles.spinner} size={32} aria-hidden />
        <p className={styles.description}>{t('resolving')}</p>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className={styles.step}>
        <p className={styles.description}>{t('permission.denied')}</p>
        <p className={styles.description}>{t('permission.openSettings')}</p>
        <div className={`${styles.actions} ${styles.actionsRow}`}>
          {onPrev && (
            <Button variant="secondary" onClick={onPrev}>
              {t('back')}
            </Button>
          )}
          <Button variant="primary" onClick={handleSkip} disabled={isLoading}>
            {t('permission.skip')}
          </Button>
        </div>
      </div>
    );
  }

  if (permission === 'granted') {
    // 자동 resolve 실패 시 retry. 정상 흐름은 useEffect 가 즉시 finishing 으로
    // 전환해 위 isWorking 분기에 잡힘.
    return (
      <div className={styles.step}>
        <p className={styles.description}>{t('resolving')}</p>
        {status === 'failed' && error && (
          <div className={`${styles.actions} ${styles.actionsCenter}`}>
            <Button
              variant="primary"
              onClick={handleAccept}
              disabled={isLoading}
            >
              {t('retry')}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.step}>
      {/* Figma "Walk 4 · 위치 권한 동의" — 우상단 header 에 "건너뛰기" text link.
          LocationPermissionPrompt 의 skip button 제거 (onSkip 미전달). */}
      <header className={styles.locationHeader}>
        <button
          type="button"
          className={styles.skipLink}
          onClick={handleSkip}
          disabled={isLoading}
        >
          {t('permission.skip')}
        </button>
      </header>
      <LocationPermissionPrompt
        onAccept={handleAccept}
        progress={
          currentStep && totalSteps
            ? { current: currentStep, total: totalSteps }
            : undefined
        }
      />
      {onPrev && (
        <div className={`${styles.actions} ${styles.actionsCenter}`}>
          <Button variant="ghost" onClick={onPrev} disabled={isLoading}>
            {t('back')}
          </Button>
        </div>
      )}
    </div>
  );
}
