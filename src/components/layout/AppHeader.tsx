'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icon';
import { ROUTES } from '@/constants/routes';
import { useNotificationBadge } from '@/features/notification/hooks/use-notification-inbox';
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
 * 알림 종 클릭 → `/notifications` 페이지로 navigate (dropdown 폐기).
 *
 * mock 도구 (NEXT_PUBLIC_USE_MSW=true 빌드 한정):
 *   - 📬 mock 편지 도착 트리거 (MockPushTrigger)
 *   - DEMO chip (MockModeBanner)
 */
export function AppHeader() {
  const t = useTranslations('header');
  const { data: unreadCount } = useNotificationBadge();
  const hasUnread = (unreadCount ?? 0) > 0;

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        {/* 1) 알림 + mock 도구 */}
        <div className={styles.slot}>
          <Link
            href={ROUTES.NOTIFICATIONS}
            aria-label={t('notification')}
            className={styles.iconButton}
          >
            <Icon name="bell" size="lg" />
            {hasUnread && <span className={styles.dot} aria-hidden />}
          </Link>
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
