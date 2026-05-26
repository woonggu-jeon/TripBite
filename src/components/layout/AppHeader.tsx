'use client';

import Link from 'next/link';
import { Bell, Settings } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ROUTES } from '@/constants/routes';
import { NotificationDropdown } from '@/features/notification/components/NotificationDropdown';
import { useNotificationInbox } from '@/features/notification/hooks/use-notification-inbox';
import styles from './AppHeader.module.scss';

/**
 * 메인 앱 공통 헤더
 *
 * 사이트맵 v2 변경:
 *   - 설정은 별도 페이지(/settings)로 승격
 *   - 헤더의 설정 아이콘은 단순 Link → 드롭다운 X
 *   - 알림은 가벼운 드롭다운 유지 (빠른 미리보기 용도)
 *
 * 좌 → 우:
 *   1) 알림 아이콘 — 드롭다운 (최근 5개) + 도트
 *   2) 로고 — 홈 링크
 *   3) 설정 아이콘 — /settings 페이지로 이동 (드롭다운 X)
 */
export function AppHeader() {
  const t = useTranslations('header');
  const [openNotification, setOpenNotification] = useState(false);

  const { data: inbox } = useNotificationInbox();
  const hasUnread = (inbox?.unreadCount ?? 0) > 0;

  return (
    <header className={styles.header}>
      {/* 1) 알림 */}
      <div className={styles.slot}>
        <button
          type="button"
          aria-label={t('notification')}
          className={styles.iconButton}
          onClick={() => setOpenNotification((v) => !v)}
        >
          <Bell size={22} />
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

      {/* 3) 설정 — 별도 페이지 이동 */}
      <div className={styles.slot} style={{ justifyContent: 'flex-end' }}>
        <Link
          href={ROUTES.SETTINGS}
          aria-label={t('settings')}
          className={styles.iconButton}
        >
          <Settings size={22} />
        </Link>
      </div>
    </header>
  );
}
