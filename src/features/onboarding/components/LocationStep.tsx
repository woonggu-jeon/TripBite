'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui';
import { track } from '@/features/analytics';
import { useGeolocation, usePermissionState } from '@/features/location';
import { locationApi } from '@/features/location/api/location';
import { useLocationStore } from '@/stores/location-store';
import styles from './LocationStep.module.scss';
import { OnboardingProgress } from './OnboardingProgress';

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
  const { request: requestGps, isLoading } = useGeolocation();
  const setResolved = useLocationStore((s) => s.setResolved);
  const [retryNeeded, setRetryNeeded] = useState(false);
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
    void (async () => {
      const ok = await resolveAndProceed();
      if (ok) {
        track('onboarding.location_allowed');
        // fire-and-forget — 다음 화면 즉시 진입, finishOnboarding 의 mutation /
        // router.replace 는 background. spinner 안 보임 (사용자 요청).
        void onNext?.();
      } else {
        setRetryNeeded(true);
      }
    })();
    // resolveAndProceed 는 closure stable 가정 (props 변경 시만 재실행).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permission, onNext]);

  async function handleAccept() {
    // "허용하기" 클릭 → OS prompt → 허용 → coords 받자마자 다음 화면.
    // setStatus 안 함 — spinner 화면 안 보임. OS prompt 동안은 기존 Walk 4
    // UI 그대로 (사용자 시각에는 OS dialog 가 가림).
    const ok = await resolveAndProceed();
    if (ok) {
      track('onboarding.location_allowed');
      void onNext?.(); // fire-and-forget
    } else {
      track('onboarding.location_skipped');
      setRetryNeeded(true);
      void (onSkip ?? onNext)?.();
    }
  }

  function handleSkip() {
    track('onboarding.location_skipped');
    void (onSkip ?? onNext)?.();
  }

  // Figma "Walk 4 · 위치 권한 동의" — WalkStep 패턴 동일 layout (header +
  // illustArea + body{copy + foot}). spinner 분기 폐기 (사용자 요청 2026-06-22)
  // — 허용 직후 즉시 다음 화면 진입, OS prompt 외 별도 대기 화면 없음.
  const isDenied = permission === 'denied';
  const isGrantedRetry = permission === 'granted' && retryNeeded;

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

      {/* 360h illustArea — 96x96 location-hero SVG (Figma circle/location 토큰 정합). */}
      <div className={styles.illustArea}>
        {/* Figma "circle/location" (3378:266) — 96x96. 이전 116 → 96 토큰 정합. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/auth/location-hero.svg"
          alt=""
          width={96}
          height={96}
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
