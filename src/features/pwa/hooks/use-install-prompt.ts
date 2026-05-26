'use client';

import { useEffect, useState } from 'react';

/**
 * PWA 설치 prompt 캡처 + 트리거 훅
 *
 * 동작:
 *   1) beforeinstallprompt 이벤트 캡처 (브라우저가 설치 가능 판단 시 발생)
 *   2) 기본 prompt 차단 (e.preventDefault)
 *   3) prompt() 호출 시점은 앱이 결정 — UX-aware:
 *      - 첫 진입에 즉시 X (거부 시 다시 못 띄움)
 *      - 토너먼트 1회 완료 / 편지 1회 송수신 / 방문 3회+ 등 가치 발견 후
 *
 * 표준 사용:
 *   const { canInstall, install, dismissed } = useInstallPrompt();
 *
 *   useEffect(() => {
 *     if (canInstall && !dismissed && userHasEngaged) {
 *       setShowInstallBanner(true);
 *     }
 *   }, [canInstall]);
 *
 * "dismissed" 는 sessionStorage 에 저장 — 한 번 닫으면 그 세션엔 다시 안 띄움.
 */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const DISMISS_KEY = '__pwa_install_dismissed__';

export function useInstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setDismissed(sessionStorage.getItem(DISMISS_KEY) === '1');

    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
    }

    function onInstalled() {
      setEvent(null);
      // 'app.installed' 이벤트 추적 가능
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  async function install() {
    if (!event) return 'unavailable' as const;
    await event.prompt();
    const choice = await event.userChoice;
    setEvent(null);
    return choice.outcome;
  }

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  }

  return {
    canInstall: !!event,
    install,
    dismiss,
    dismissed,
  };
}
