'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/Icon';
import { ROUTES } from '@/constants/routes';
import { NotificationDropdown } from '@/features/notification/components/NotificationDropdown';
import { useNotificationInbox } from '@/features/notification/hooks/use-notification-inbox';
import styles from './AppHeader.module.scss';

/**
 * 메인 앱 공통 헤더
 *
 * 변경: 아이콘 → SVG sprite (<Icon />)
 * 좌 → 우: 알림 / 로고 / 설정
 */
export function AppHeader() {
  const t = useTranslations('header');
  const [openNotification, setOpenNotification] = useState(false);

  const { data: inbox } = useNotificationInbox();
  const hasUnread = (inbox?.unreadCount ?? 0) > 0;

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        {/* 1) 알림 */}
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
