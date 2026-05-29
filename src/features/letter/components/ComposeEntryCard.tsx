'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ROUTES } from '@/constants/routes';
import styles from './ComposeEntryCard.module.scss';

/**
 * /letter 메인 상단 hero — 편지 보내러 가기 CTA.
 * 큰 그라데이션 hero + 본문 + 화살표 → /letter/compose
 */
export function ComposeEntryCard() {
  const t = useTranslations('letter.indexCta');

  return (
    <Link href={ROUTES.LETTER_COMPOSE} className={styles.card}>
      <div className={styles.hero} aria-hidden>
        <span className={styles.envelope}>✉️</span>
        <span className={styles.sparkle1}>✦</span>
        <span className={styles.sparkle2}>✦</span>
      </div>
      <div className={styles.body}>
        <div>
          <h2 className={styles.title}>{t('title')}</h2>
          <p className={styles.subtitle}>{t('subtitle')}</p>
        </div>
        <span className={styles.arrow} aria-hidden>
          <ArrowRight size={20} />
        </span>
      </div>
    </Link>
  );
}
