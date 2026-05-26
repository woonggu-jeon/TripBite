'use client';

import { useTranslations } from 'next-intl';
import { useServiceWorkerUpdate } from '@/features/pwa/hooks/use-service-worker-update';
import styles from './Banner.module.scss';

/**
 * <PwaUpdateBanner />
 *
 * 새 빌드 배포 시 사용자에게 "새 버전이 있어요" 알림.
 * Providers 안에 마운트.
 *
 * 안 만들면 사용자가 영원히 옛 SW 로 캐시된 자원을 봄.
 */
export function PwaUpdateBanner() {
  const t = useTranslations('pwa.update');
  const { hasUpdate, applyUpdate } = useServiceWorkerUpdate();

  if (!hasUpdate) return null;

  return (
    <div className={styles.banner} role="alert">
      <span className={styles.message}>{t('message')}</span>
      <button type="button" className={styles.action} onClick={applyUpdate}>
        {t('apply')}
      </button>
    </div>
  );
}
