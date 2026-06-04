'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/Icon';
import { ROUTES } from '@/constants/routes';
import { NotificationDropdown } from '@/features/notification/components/NotificationDropdown';
import { useNotificationInbox } from '@/features/notification/hooks/use-notification-inbox';
import { MockModeBanner } from '@/features/pwa/components/MockModeBanner';
import { MockPushTrigger } from '@/features/notification/components/MockPushTrigger';
import { MockAuthToggle } from '@/features/auth/components/MockAuthToggle';
import styles from './AppHeader.module.scss';

const MSW_ENABLED = process.env.NEXT_PUBLIC_USE_MSW === 'true';

/**
 * 메인 앱 공통 헤더
 *
 * 좌 → 우: [알림 + (mock 도구)] [로고] [설정]
 *
 * mock 도구 (NEXT_PUBLIC_USE_MSW=true 빌드 한정):
 *   - 📬 mock 편지 도착 트리거 (MockPushTrigger)
 *   - DEMO chip (MockModeBanner)
 *
 * 운영 빌드 (USE_MSW=false) 에서는 mock 도구 mount 안 됨.
 */
export function AppHeader() {
  const t = useTranslations('header');
  const [openNotification, setOpenNotification] = useState(false);

  const { data: inbox } = useNotificationInbox();
  const hasUnread = (inbox?.unreadCount ?? 0) > 0;

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        {/* 1) 알림 + mock 도구 */}
        <div className={styles.slot}>
          <button
            type="button"
            aria-label={t('notification')}
            className={styles.iconButton}
            onClick={() => setOpenNotification((v) => !v)}
          >
            <Icon name="bell" size="lg" />
            {hasUnread && <span className={styles.dot} aria-hidden />}
          </button>
          {openNotification && (
            <NotificationDropdown onClose={() => setOpenNotification(false)} />
          )}
          {MSW_ENABLED && (
            <>
              <MockAuthToggle />
              <MockPushTrigger />
              <MockModeBanner />
            </>
          )}
        </div>

        {/* 2) 로고 */}
        <Link href={ROUTES.HOME} className={styles.logo} aria-label="Home">
          {t('logo')}
        </Link>

        {/* 3) 설정 */}
        <div className={`${styles.slot} ${styles.slotEnd}`}>
          <Link
            href={ROUTES.SETTINGS}
            aria-label={t('settings')}
            className={styles.iconButton}
          >
            <Icon name="settings" size="lg" />
          </Link>
        </div>
      </div>
    </header>
  );
}
