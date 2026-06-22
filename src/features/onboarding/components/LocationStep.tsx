'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { useGeolocation, usePermissionState } from '@/features/location';
import { locationApi } from '@/features/location/api/location';
import { useLocationStore } from '@/stores/location-store';
import { track } from '@/features/analytics';
import { Button } from '@/components/ui';
import { OnboardingProgress } from './OnboardingProgress';
import styles from './LocationStep.module.scss';

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
 * **Fast-path (2026-06-22 사용자 요청)**:
 *   GPS 좌표 받자마자 즉시 다음 화면 진입 (reverse geocode 대기 X). BE
 *   reverse 는 background fire-and-forget — 완료 시 location-store 의 label/
 *   regionCode 자연 갱신. 사용자는 "허용" 직후 곧바로 다음 step 으로 진행.
 *   spinner "가져오는 중..." 화면 거의 안 보임 (onNext 의 mutation 완료까지만).
 *   useResolveLocation 의 기존 동작 (reverse 까지 완료 후 반환) 은 다른 사용처
 *   (LetterComposeForm) 가 의존 — 거기는 변경 X. 본 step 만 LocationStep 안에서
 *   useGeolocation + locationApi.reverseGeocode 직접 조합.
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
  const { request: requestGps, isLoading, error } = useGeolocation();
  const setResolved = useLocationStore((s) => s.setResolved);
  const [status, setStatus] = useState<
    'idle' | 'resolving' | 'finishing' | 'resolved' | 'failed'
  >('idle');
  const grantedAutoTriggered = useRef(false);

  /**
   * GPS 좌표 받자마자 store hydrate + 다음 step 진입.
   * BE reverse geocode 는 background — 완료 시 store 갱신 (label/regionCode).
   * 실패해도 좌표 fallback label 유지.
   */
  async function resolveAndProceed(): Promise<boolean> {
    const coords = await requestGps();
    if (!coords) return false;

    const initial = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
      label: `${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)}`,
    };
    setResolved(initial);

    // background reverse — 사용자는 다음 화면 진행. 완료 시 자연 갱신.
    void locationApi
      .reverseGeocode(coords)
      .then((result) => setResolved(result))
      .catch(() => {
        /* 좌표 fallback 유지 */
      });

    return true;
  }

  useEffect(() => {
    if (permission !== 'granted' || grantedAutoTriggered.current) return;
    grantedAutoTriggered.current = true;
    setStatus('resolving');
    void (async () => {
      const ok = await resolveAndProceed();
      if (ok) {
        track('onboarding.location_allowed');
        // mutation isPending 까지 spinner 유지 — finishing 으로 전환.
        setStatus('finishing');
        await onNext?.();
        setStatus('resolved');
      } else {
        setStatus('failed');
      }
    })();
    // resolveAndProceed 는 closure stable 가정 (props 변경 시만 재실행).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permission, onNext]);

  async function handleAccept() {
    setStatus('resolving');
    const ok = await resolveAndProceed();
    if (ok) {
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
        <p className={styles.tagline}>{t('resolving')}</p>
      </div>
    );
  }

  // Figma "Walk 4 · 위치 권한 동의" — WalkStep 패턴 동일 layout (header +
  // illustArea + body{copy + foot}). permission 상태 (prompt/granted/denied)
  // 무관 동일 layout, 본문 / button 만 분기.
  const isDenied = permission === 'denied';
  const isGrantedRetry = permission === 'granted' && status === 'failed';

  return (
    <div className={styles.step}>
      {/* 우상단 "건너뛰기" text link — Figma Walk 4 header. */}
      <header className={styles.header}>
        <button
          type="button"
          className={styles.skipLink}
          onClick={handleSkip}
          disabled={isLoading}
        >
          {t('permission.skip')}
        </button>
      </header>

      {/* 360h illustArea — 116x116 location-hero SVG (다른 Walk 와 동일 비율). */}
      <div className={styles.illustArea}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/auth/location-hero.svg"
          alt=""
          width={116}
          height={116}
          className={styles.icon}
        />
      </div>

      {/* body — copy + foot (progress + button). Walk 1/2/3 패턴 동일. */}
      <div className={styles.body}>
        <div className={styles.copy}>
          <h2 className={styles.title}>
            {isDenied ? t('permission.denied') : t('permission.title')}
          </h2>
          <p className={styles.tagline}>
            {isDenied
              ? t('permission.openSettings')
              : t('permission.description')}
          </p>
        </div>
        <div className={styles.foot}>
          {currentStep && totalSteps && (
            <OnboardingProgress current={currentStep} total={totalSteps} />
          )}
          {isDenied ? (
            // denied — 다시 시도 의미 없음 (브라우저 차단). "건너뛰기" 만 primary.
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleSkip}
              disabled={isLoading}
            >
              {t('permission.skip')}
            </Button>
          ) : (
            // prompt / granted-retry — 허용 (또는 retry) primary.
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleAccept}
              disabled={isLoading}
            >
              {isGrantedRetry ? t('retry') : t('permission.request')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
