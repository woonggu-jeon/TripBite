'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Home, TrendingUp, Trophy, Mail, User } from 'lucide-react';
import { BOTTOM_NAV_ROUTES } from '@/constants/routes';
import styles from './BottomNav.module.scss';

const ICONS = {
  home: Home,
  'trending-up': TrendingUp,
  trophy: Trophy,
  mail: Mail,
  user: User,
} as const;

/**
 * 하단 네비게이션 (5 탭)
 *
 * 사이트맵: 가운데 토너먼트가 emphasized (raised circle).
 *
 * 활성 기준:
 *   - 홈("/")은 정확히 일치
 *   - 나머지는 prefix 매칭 (예: /tournament/play 도 토너먼트 탭 활성)
 *
 * 성능:
 *   - 단순 Link + usePathname (recoil/zustand 미사용)
 *   - 페이지 전환 시 BottomNav 자체는 (main) layout이라 재마운트 X
 *   - 아이콘은 lucide-react 의 named import → tree-shake 보장
 */
export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations('nav');

  const isActive = (path: string) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path);

  return (
    <nav className={styles.nav} aria-label={t('home')}>
      {BOTTOM_NAV_ROUTES.map((route) => {
        const Icon = ICONS[route.icon];
        const active = isActive(route.path);
        const emphasized = 'emphasized' in route && route.emphasized;

        return (
          <Link
            key={route.path}
            href={route.path}
            className={[
              styles.item,
              active ? styles.active : '',
              emphasized ? styles.emphasized : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-current={active ? 'page' : undefined}
          >
            <span className={emphasized ? styles.emphasizedCircle : ''}>
              <Icon size={emphasized ? 26 : 22} />
            </span>
            <span className={styles.label}>{t(route.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
