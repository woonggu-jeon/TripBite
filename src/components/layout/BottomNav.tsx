'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Icon, type IconName } from '@/components/icon';
import { BOTTOM_NAV_ROUTES } from '@/constants/routes';
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
 * 숨김 분기 (사용자 피드백 2026-06-24): 토너먼트 흐름 (`/tournament*`) 은
 * 하단 fixed "다음/시작" button 과 nav 가 겹쳐 가려지는 문제 + 흐름 집중도
 * (테스트 진행 중 다른 경로 이탈 차단) 위해 미렌더.
 */
export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations('nav');

  if (pathname.startsWith('/tournament')) {
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
