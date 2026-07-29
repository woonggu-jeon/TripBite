'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, type IconName } from '@/components/icon';
import { BOTTOM_NAV_ROUTES, NAV_HIDE_ROUTES } from '@/constants/routes';
import { haptic } from '@/lib/haptic';
import styles from './BottomNav.module.scss';

/**
 * 하단 네비게이션 — Figma "nav" 정합 (2026-06-23).
 *
 * 5 평등 탭 (72×62 each). icon 24 + Caption M_10 label.
 *   - 비활성: text-disabled (#B4B4B4)
 *   - 활성: primary + Bold (B_10)
 *
 * 아이콘은 SVG sprite (<Icon />). 활성 기준:
 *   - 홈("/") 정확히 일치
 *   - 나머지는 prefix 매칭 (예: /tournament/play 도 토너먼트 탭 활성)
 *
 * 숨김 분기: `NAV_HIDE_ROUTES` (constants/routes.ts) 매칭 시 미렌더.
 *   - 토너먼트 흐름 (`/tournament*`): 하단 fixed CTA + 흐름 집중도.
 *   - 편지 sub (`/letter/*`): compose/sent/[id] 모두 하단 fixed CTA.
 * 새 hide 페이지는 constants 의 NAV_HIDE_ROUTES 만 갱신 (2026-06-24 정합).
 */
export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations('nav');

  const shouldHide = NAV_HIDE_ROUTES.some((route) =>
    route.prefix ? pathname.startsWith(route.path) : pathname === route.path,
  );
  if (shouldHide) {
    return null;
  }

  const isActive = (path: string) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path);

  return (
    <nav className={styles.nav} aria-label={t('home')}>
      {BOTTOM_NAV_ROUTES.map((route) => {
        const active = isActive(route.path);
        return (
          <Link
            key={route.path}
            href={route.path}
            onClick={() => haptic.tap()}
            className={[styles.item, active ? styles.active : '']
              .filter(Boolean)
              .join(' ')}
            aria-current={active ? 'page' : undefined}
          >
            <Icon
              name={route.icon as IconName}
              size={24}
              aria-label={t(route.labelKey)}
            />
            <span className={styles.label}>{t(route.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
