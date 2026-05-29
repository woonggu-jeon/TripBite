'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { useServiceWorkerUpdate } from '@/features/pwa/hooks/use-service-worker-update';
import styles from './Banner.module.scss';

/**
 * <PwaUpdateBanner />
 *
 * 새 빌드 배포 시 사용자에게 "새 버전이 있어요" 알림.
 * Providers 안에 마운트.
 *
 * dismiss: sessionStorage 로 세션 단위 기억 — 사용자가 X 누르면 그 세션은 안 보임.
 * 다음 방문(새 세션)에 다시 표시 → 영원히 묻혀 옛 SW 캐시 자원을 보는 일은 방지.
 */
const DISMISS_KEY = '__pwa_update_dismissed__';

export function PwaUpdateBanner() {
  const t = useTranslations('pwa.update');
  const { hasUpdate, applyUpdate } = useServiceWorkerUpdate();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(DISMISS_KEY) === '1') setDismissed(true);
  }, []);

  if (!hasUpdate || dismissed) return null;

  return (
    <div className={styles.banner} role="alert">
      <span className={styles.message}>{t('message')}</span>
      <button type="button" className={styles.action} onClick={applyUpdate}>
        {t('apply')}
      </button>
      <button
        type="button"
        aria-label={t('dismiss')}
        className={styles.close}
        onClick={() => {
          sessionStorage.setItem(DISMISS_KEY, '1');
          setDismissed(true);
        }}
      >
        <X size={18} aria-hidden />
      </button>
    </div>
  );
}
