'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useInstallPrompt } from '@/features/pwa/hooks/use-install-prompt';
import { track } from '@/features/analytics';
import { isIOS, isStandalone } from '@/lib/platform';
import styles from './Banner.module.scss';

/**
 * <InstallPromptBanner />
 *
 * 플랫폼 분기:
 *   - Android / Desktop Chrome: beforeinstallprompt 이벤트 캡처 + 표시
 *   - iOS Safari: 이벤트 미지원 → "공유 → 홈 화면에 추가" 안내 텍스트
 *
 * 표시 조건:
 *   - 이미 standalone (설치된 상태) 이면 표시 X
 *   - dismiss 한 세션이면 표시 X
 *   - canInstall (beforeinstallprompt) 또는 iOS Safari 일 때 표시
 */
const IOS_DISMISS_KEY = '__pwa_install_ios_dismissed__';

export function InstallPromptBanner() {
  const t = useTranslations('pwa.install');
  const { canInstall, install, dismiss, dismissed } = useInstallPrompt();
  const [iosState, setIosState] = useState<{
    show: boolean;
    dismissed: boolean;
  }>({ show: false, dismissed: false });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const standalone = isStandalone();
    if (standalone) return;
    if (!isIOS()) return;
    const iosDismissed = sessionStorage.getItem(IOS_DISMISS_KEY) === '1';
    setIosState({ show: true, dismissed: iosDismissed });
  }, []);

  // 1) Android / Desktop: 이벤트 기반
  if (canInstall && !dismissed) {
    return (
      <div className={styles.banner} role="status">
        <span className={styles.message}>{t('description')}</span>
        <button
          type="button"
          className={styles.action}
          onClick={async () => {
            const outcome = await install();
            if (outcome === 'accepted') track('app.installed');
          }}
        >
          {t('install')}
        </button>
        <button
          type="button"
          aria-label={t('later')}
          onClick={dismiss}
          style={{ color: 'inherit', padding: '0 6px', opacity: 0.7 }}
        >
          ✕
        </button>
      </div>
    );
  }

  // 2) iOS Safari: 안내 텍스트만 (자동 prompt 불가)
  if (iosState.show && !iosState.dismissed) {
    return (
      <div className={styles.banner} role="status">
        <span className={styles.message}>{t('iosGuide')}</span>
        <button
          type="button"
          aria-label={t('later')}
          onClick={() => {
            sessionStorage.setItem(IOS_DISMISS_KEY, '1');
            setIosState((s) => ({ ...s, dismissed: true }));
          }}
          style={{ color: 'inherit', padding: '0 6px', opacity: 0.7 }}
        >
          ✕
        </button>
      </div>
    );
  }

  return null;
}
