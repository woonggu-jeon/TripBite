'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icon';
import { LogoMark } from '@/components/brand/LogoMark';
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
  const tBrand = useTranslations('brand');
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

        {/* 2) 로고 — Figma HOME 헤더는 마크 + "여행한입" 이다.
               구현은 header.logo("Travel") 텍스트만 있어 스플래시/로그인의
               브랜드 표기와 어긋나 있었다. */}
        <Link
          href={ROUTES.HOME}
          className={styles.logo}
          aria-label={tBrand('name')}
        >
          <LogoMark size={24} className={styles.logoMark} />
          {tBrand('name')}
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
