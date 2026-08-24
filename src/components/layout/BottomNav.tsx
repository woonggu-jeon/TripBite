'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Icon, type IconName } from '@/components/icon';
import { BOTTOM_NAV_ROUTES } from '@/constants/routes';
import { haptic } from '@/lib/haptic';
import styles from './BottomNav.module.scss';

/**
 * 하단 네비게이션 (5 탭)
 *
 * 변경 사항:
 *   - 아이콘을 lucide-react 에서 SVG sprite (<Icon />) 로 교체
 *     · 다른 페이지에 lucide 아이콘 import 가 없는 페이지는 lucide 전체를 다운로드 안 함
 *     · 첫 진입 시 /icons.svg 한 번 다운로드 (SW 캐시 후 영구)
 *   - 탭 클릭 시 미세 햅틱 (모바일)
 *
 * 활성 기준:
 *   - 홈("/")은 정확히 일치
 *   - 나머지는 prefix 매칭 (예: /tournament/play 도 토너먼트 탭 활성)
 */
export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations('nav');

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
            {/* Figma navIcon 24x24 — 5탭 동일 */}
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
