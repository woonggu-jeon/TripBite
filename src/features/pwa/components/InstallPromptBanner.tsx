'use client';

import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { track } from '@/features/analytics';
import { useInstallPrompt } from '@/features/pwa/hooks/use-install-prompt';
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
 *   - **방문 횟수 ≥ 3 회** — 즉시 prompt 가 사용자 학습 전에 거부당해 영구 dismiss 되는
 *     회귀 회피. 사용자가 앱 가치를 알아본 시점에 노출.
 *   - canInstall (beforeinstallprompt) 또는 iOS Safari 일 때 표시
 */
const IOS_DISMISS_KEY = '__pwa_install_ios_dismissed__';
const VISIT_COUNT_KEY = '__pwa_visit_count__';
const VISIT_THRESHOLD = 3;

/** 방문 횟수 증가 + 현재 횟수 반환 — page reload 마다 1 회 호출. */
function bumpVisitCount(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const current = Number(localStorage.getItem(VISIT_COUNT_KEY) ?? '0');
    const next = Number.isFinite(current) ? current + 1 : 1;
    localStorage.setItem(VISIT_COUNT_KEY, String(next));
    return next;
  } catch {
    return 0;
  }
}

export function InstallPromptBanner() {
  const t = useTranslations('pwa.install');
  const { canInstall, install, dismiss, dismissed } = useInstallPrompt();
  const [iosState, setIosState] = useState<{
    show: boolean;
    dismissed: boolean;
  }>({ show: false, dismissed: false });
  const [engaged, setEngaged] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // 방문 횟수 증가 — engagement gate.
    const visits = bumpVisitCount();
    setEngaged(visits >= VISIT_THRESHOLD);

    const standalone = isStandalone();
    if (standalone) return;
    if (!isIOS()) return;
    const iosDismissed = sessionStorage.getItem(IOS_DISMISS_KEY) === '1';
    setIosState({ show: true, dismissed: iosDismissed });
  }, []);

  // engagement gate 통과 전엔 banner 자체 미노출.
  if (!engaged) return null;

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
          className={styles.close}
          onClick={dismiss}
        >
          <X size={18} aria-hidden />
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
          className={styles.close}
          onClick={() => {
            sessionStorage.setItem(IOS_DISMISS_KEY, '1');
            setIosState((s) => ({ ...s, dismissed: true }));
          }}
        >
          <X size={18} aria-hidden />
        </button>
      </div>
    );
  }

  return null;
}
