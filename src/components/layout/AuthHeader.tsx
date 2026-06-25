'use client';

import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icon/Icon';
import { haptic } from '@/lib/haptic';
import styles from './AuthHeader.module.scss';

/**
 * Auth 페이지 공통 header — Figma "FindIdA/FindPwA/FindId 결과" 노드.
 *
 *   row alignItems center, height 54, padding-left 10
 *   └ 36x36 slot (click target)
 *       └ 24x24 ChevronLeft SVG (back arrow)
 *
 * 동작: history > 1 → router.back(), 아니면 props.fallbackHref 또는 '/'.
 *
 * 사용:
 *   <AuthLayout>
 *     <AuthHeader />
 *     <FindIdForm />
 *   </AuthLayout>
 */
export function AuthHeader({
  fallbackHref = '/' as Route,
}: {
  fallbackHref?: Route;
}) {
  const router = useRouter();
  const t = useTranslations('common');

  const handleBack = () => {
    haptic.tap();
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    router.replace(fallbackHref);
  };

  return (
    <header className={styles.header}>
      <button
        type="button"
        className={styles.slot}
        onClick={handleBack}
        aria-label={t('back')}
      >
        <Icon name="back" size={24} />
      </button>
    </header>
  );
}
