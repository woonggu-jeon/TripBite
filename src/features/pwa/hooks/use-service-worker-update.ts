'use client';

import { useEffect, useState } from 'react';

/**
 * Service Worker 업데이트 감지 훅
 *
 * 동작:
 *   1) SW가 등록되어 있는지 확인 (next-pwa 가 production 에서 자동 등록)
 *   2) waiting (대기 중인 새 SW) 감지
 *   3) updatefound 이벤트로 새 SW 인스톨 중 감지
 *   4) 사용자에게 새 버전 알림 → reload 시 새 SW 활성화
 *
 * 사용:
 *   const { hasUpdate, applyUpdate } = useServiceWorkerUpdate();
 *   {hasUpdate && <PwaUpdateBanner onApply={applyUpdate} />}
 *
 * applyUpdate:
 *   - waiting SW 에 SKIP_WAITING postMessage
 *   - controllerchange 후 window.location.reload()
 */
export function useServiceWorkerUpdate() {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator))
      return;

    let cancelled = false;

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (cancelled || !reg) return;
      setRegistration(reg);

      // 이미 대기 중인 SW
      if (reg.waiting) setHasUpdate(true);

      // 새 SW 설치 중 감지
      reg.addEventListener('updatefound', () => {
        const installing = reg.installing;
        if (!installing) return;
        installing.addEventListener('statechange', () => {
          if (
            installing.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            setHasUpdate(true);
          }
        });
      });
    });

    // controller 가 바뀌면 (skipWaiting 후) reload
    let refreshing = false;
    function onControllerChange() {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    }
    navigator.serviceWorker.addEventListener(
      'controllerchange',
      onControllerChange,
    );

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener(
        'controllerchange',
        onControllerChange,
      );
    };
  }, []);

  function applyUpdate() {
    if (!registration?.waiting) {
      // 대기 SW 가 없다면 그냥 reload
      window.location.reload();
      return;
    }
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  return { hasUpdate, applyUpdate };
}
