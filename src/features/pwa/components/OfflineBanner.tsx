'use client';

import { useTranslations } from 'next-intl';
import { useOnline } from '@/features/pwa/hooks/use-online';
import styles from './Banner.module.scss';

/**
 * <OfflineBanner />
 *
 * 네트워크 끊김 시 상단/하단에 표시.
 * Providers 안에 마운트.
 *
 * 사용자는 SW 캐시된 콘텐츠는 그대로 볼 수 있어야 함.
 */
export function OfflineBanner() {
  const t = useTranslations('pwa.offline');
  const online = useOnline();
  if (online) return null;

  return (
    <div className={`${styles.banner} ${styles.warning}`} role="status">
      <span className={styles.message}>{t('message')}</span>
    </div>
  );
}
