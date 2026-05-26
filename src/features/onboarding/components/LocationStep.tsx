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

/**
 * <LocationStep /> — 온보딩 step 2
 *
 * 권한 상태별 분기:
 *   - 'granted': step 진입 직후 자동 resolve (prompt 안 뜸)
 *   - 'prompt' / 'unsupported': LocationPermissionPrompt 노출 → 사용자가 "허용" 클릭 시 resolve
 *   - 'denied': "권한 차단" 안내 + 건너뛰기만 가능 (브라우저가 prompt 재요청 막음)
 *
 * iOS 정책:
 *   getCurrentPosition은 사용자 액션 직후에만. 'granted' 상태에서 mount-time 호출은
 *   prompt가 안 뜨므로 정책 위반 아님. 그 외 상태는 항상 버튼 클릭으로 트리거.
 *
 * 결과 처리:
 *   - resolve 성공 → location-store에 저장 + 'onboarding.location_allowed' track
 *   - skip 또는 실패 → 'onboarding.location_skipped' track + onNext (없으면 onSkip)
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

  // 'granted' 상태에서만 자동 resolve (prompt 뜨지 않음)
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
        // GPS 거부 + IP fallback 실패. skip 처리.
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

  // denied: 브라우저가 prompt 재요청을 차단 — 안내 + 건너뛰기만
  if (permission === 'denied') {
    return (
      <div style={{ display: 'grid', gap: '1rem', padding: '1rem 0' }}>
        <p style={{ color: 'var(--color-muted)' }}>{t('permission.denied')}</p>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>
          {t('permission.openSettings')}
        </p>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {onPrev && (
            <button type="button" onClick={onPrev}>
              {t('back')}
            </button>
          )}
          <button type="button" onClick={handleSkip} disabled={isLoading}>
            {t('permission.skip')}
          </button>
        </div>
      </div>
    );
  }

  // granted: 자동 resolve 진행 중. 로딩만 표시.
  if (permission === 'granted') {
    return (
      <div style={{ display: 'grid', gap: '0.5rem', padding: '1rem 0' }}>
        <p>{t('resolving')}</p>
        {status === 'failed' && error && (
          <button type="button" onClick={handleAccept} disabled={isLoading}>
            {t('retry')}
          </button>
        )}
      </div>
    );
  }

  // prompt / unsupported: 사전 안내 → 사용자 명시 클릭으로 권한 요청
  return (
    <div style={{ display: 'grid', gap: '1rem', padding: '1rem 0' }}>
      <LocationPermissionPrompt onAccept={handleAccept} onSkip={handleSkip} />
      {onPrev && (
        <button type="button" onClick={onPrev} disabled={isLoading}>
          {t('back')}
        </button>
      )}
    </div>
  );
}
