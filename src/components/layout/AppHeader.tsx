'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Icon } from '@/components/icon';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { ROUTES } from '@/constants/routes';
import { MockAuthToggle } from '@/features/auth/components/MockAuthToggle';
import { MockPushTrigger } from '@/features/notification/components/MockPushTrigger';
import { useNotificationBadge } from '@/features/notification/hooks/use-notification-inbox';
import { MockModeBanner } from '@/features/pwa/components/MockModeBanner';
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
            <Icon name="noti" size="lg" />
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

        {/* 2) 로고 — Figma "trip-bite-logo" (Frame 6 row gap 4) — Group 1 SVG
            + Title B_18 "여행 한입" fg. */}
        <Link href={ROUTES.HOME} className={styles.logo} aria-label={t('home')}>
          <BrandLogo width={28} />
          <span className={styles.logoText}>{t('logo')}</span>
        </Link>

        {/* 3) 설정 — Figma 우측은 IC-Header (search icon 표현) 이지만 사이트에
            검색 페이지 없음 — settings link 유지 (실 기능 정합 우선). */}
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
