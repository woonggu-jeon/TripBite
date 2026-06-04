'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import styles from './SettingsRows.module.scss';

/**
 * 정책 섹션
 *
 * 약관/개인정보처리방침은:
 *   - 옵션 A: 내부 정적 페이지 (/policy/terms, /policy/privacy) — Server Component
 *   - 옵션 B: 외부 URL (회사 사이트)
 *
 * 변경 빈도가 낮으므로 Server Component + 정적 빌드가 가장 효율적.
 */
export function PolicySection() {
  const t = useTranslations('settings.policy');
  return (
    <div className={styles.list}>
      <Link href="/policy/terms" className={styles.button}>
        {t('terms')}
      </Link>
      <Link href="/policy/privacy" className={styles.button}>
        {t('privacy')}
      </Link>
      {/* 오픈소스 라이센스 — 미노출 (사용자 요청). 추후 복원 시 주석 해제.
          /policy/licenses 페이지 자체는 유지.
      <Link href="/policy/licenses" className={styles.button}>
        {t('licenses')}
      </Link>
      */}
    </div>
  );
}
