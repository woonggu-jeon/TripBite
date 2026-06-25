'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';
import { Icon } from '@/components/icon/Icon';
import { ROUTES } from '@/constants/routes';
import { getCurrentSeason } from '@/features/tournament/utils/season';
import type { Season } from '@/api/generated/schemas';
import styles from './HomeDashboard.module.scss';

/**
 * 홈 빠른시작 — Figma "HOME · 홈 · quick-actions" (2026-06-23) 정합.
 *
 * 2 banner row (320×74 / 320×79 column gap 9):
 *   - banner 1: bg primary-soft + circle 44 primary + Trophy 22 white + title
 *     B_14 fg + subtitle R_12 muted + pill 58×44 primary "시작" SemiBold 14 white.
 *   - banner 2: bg amber-soft (#FCEFD9) + circle 44 amber (#F79D26) +
 *     Sparkles 22 white + 유사 layout + pill amber "테스트".
 *
 * Client island 로 분리한 이유: getCurrentSeason() 의 시간대 의존성 격리.
 * SSR/CSR mismatch 회피.
 */
export function HomeQuickActions() {
  const t = useTranslations('home.widgets.quick');
  const [season, setSeason] = useState<Season>('spring');

  useEffect(() => {
    setSeason(getCurrentSeason());
  }, []);

  return (
    <section className={styles.quickActions}>
      <Link
        href={{
          pathname: ROUTES.TOURNAMENT,
          query: { theme: 'season', season },
        }}
        className={`${styles.qaBanner} ${styles.qaBannerPrimary}`}
        aria-label={t(`tournamentBySeason.${season}`)}
      >
        <span className={`${styles.qaCircle} ${styles.qaCirclePrimary}`}>
          <Icon name="award" size={22} />
        </span>
        <span className={styles.qaText}>
          <span className={styles.qaTitle}>
            {t(`tournamentBySeason.${season}`)}
          </span>
          <span className={styles.qaSubtitle}>{t('tournamentSubtitle')}</span>
        </span>
        <span className={`${styles.qaBtn} ${styles.qaBtnPrimary}`}>
          {t('tournamentCta')}
        </span>
      </Link>

      <Link
        href={ROUTES.QUIZ}
        className={`${styles.qaBanner} ${styles.qaBannerAmber}`}
        aria-label={t('quizTitle')}
      >
        <span className={`${styles.qaCircle} ${styles.qaCircleAmber}`}>
          <Sparkles size={22} aria-hidden />
        </span>
        <span className={styles.qaText}>
          <span className={styles.qaTitle}>{t('quizTitle')}</span>
          <span className={styles.qaSubtitle}>{t('quizSubtitle')}</span>
        </span>
        <span className={`${styles.qaBtn} ${styles.qaBtnAmber}`}>
          {t('quizCta')}
        </span>
      </Link>
    </section>
  );
}
