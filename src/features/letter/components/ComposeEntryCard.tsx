'use client';

import Link from 'next/link';
import { Icon } from '@/components/icon/Icon';
import { useTranslations } from 'next-intl';
import { ROUTES } from '@/constants/routes';
import styles from './ComposeEntryCard.module.scss';

/**
 * /letter 메인 mb banner — Figma "편지 메인 · mb · banner" 정합 (2026-06-24).
 *
 * spec:
 *   - banner 320×147 padding 20 16 gap 12 bg #EAF6EF (secondary01) + 1px primary
 *     border + radius 12 column center.
 *   - bic 50×50 white radius 14 center — Send icon 24 primary 1.7 stroke.
 *   - f (column gap 3 center):
 *     · title B_14 fg "마음을 다섯 글자로 담아보세요"
 *     · title B_16 primary "편지 쓰러 가기"
 */
export function ComposeEntryCard() {
  const t = useTranslations('letter.banner');

  return (
    <Link
      href={ROUTES.LETTER_COMPOSE}
      className={styles.banner}
      aria-label={t('cta')}
    >
      <span className={styles.bic} aria-hidden>
        <Icon name="send" size={24} />
      </span>
      <div className={styles.f}>
        <span className={styles.lead}>{t('lead')}</span>
        <span className={styles.cta}>{t('cta')}</span>
      </div>
    </Link>
  );
}
