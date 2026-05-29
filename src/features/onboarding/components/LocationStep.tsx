'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
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
 */
export function LocationStep({
  onNext,
  onPrev,
  onSkip,
}: {
  onNext?: () => void;
  onPrev?: () => void;
  onSkip?: () => void;
}) {
  const t = useTranslations('location');
  const permission = usePermissionState();
  const { resolve, isLoading, error } = useResolveLocation();
  const setResolved = useLocationStore((s) => s.setResolved);
  const [status, setStatus] = useState<
    'idle' | 'resolving' | 'resolved' | 'failed'
  >('idle');
  const grantedAutoTriggered = useRef(false);

  useEffect(() => {
    if (permission !== 'granted' || grantedAutoTriggered.current) return;
    grantedAutoTriggered.current = true;
    setStatus('resolving');
    void resolve().then((r) => {
      if (r) {
        setResolved(r);
        track('onboarding.location_allowed');
        setStatus('resolved');
        onNext?.();
      } else {
        setStatus('failed');
      }
    });
  }, [permission, resolve, setResolved, onNext]);

  function handleAccept() {
    setStatus('resolving');
    void resolve().then((r) => {
      if (r) {
        setResolved(r);
        track('onboarding.location_allowed');
        setStatus('resolved');
        onNext?.();
      } else {
        track('onboarding.location_skipped');
        setStatus('failed');
        (onSkip ?? onNext)?.();
      }
    });
  }

  function handleSkip() {
    track('onboarding.location_skipped');
    (onSkip ?? onNext)?.();
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
      <LocationPermissionPrompt onAccept={handleAccept} onSkip={handleSkip} />
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
