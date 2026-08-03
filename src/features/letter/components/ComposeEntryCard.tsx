'use client';

import Link from 'next/link';
import { Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ROUTES } from '@/constants/routes';
import styles from './ComposeEntryCard.module.scss';

/**
 * /letter 메인 상단 배너 — 편지 보내러 가기 CTA → /letter/compose
 *
 * Figma `편지 메인 > banner` 실측 (320x147):
 *   연초록 면(#EAF6EF) + 1px 초록 보더, radius 12, V gap 12, padding 20/16
 *   ├ `bic` 50x50 흰 면 radius 12 + 24px 아이콘
 *   └ `f`   보조 문구 14 Bold #151515 → CTA 문구 16 Bold 초록
 *
 * 구 구현은 140px 그라데이션 hero + 봉투 emoji + 원형 화살표 버튼으로
 * 시안보다 두 배 높았다.
 */
export function ComposeEntryCard() {
  const t = useTranslations('letter.indexCta');

  return (
    <Link href={ROUTES.LETTER_COMPOSE} className={styles.card}>
      {/* Figma `bic` 50x50 — 흰 면 radius 12 안에 24px 아이콘 */}
      <span className={styles.iconBox} aria-hidden>
        <Mail size={24} />
      </span>
      {/* Figma `f` — 보조 문구(14 Bold 검정) 위, CTA 문구(16 Bold 초록) 아래 */}
      <span className={styles.body}>
        <span className={styles.subtitle}>{t('subtitle')}</span>
        <span className={styles.title}>{t('title')}</span>
      </span>
    </Link>
  );
}
