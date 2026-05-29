'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui';
import styles from './OnboardingStep.module.scss';

/**
 * <ConceptStep /> — 온보딩 step 1
 *
 * 컨셉 소개. 정적 UI + 다음 버튼만.
 * 일러스트는 디자인 확정 후 교체 (지금은 이모지 placeholder).
 */
export function ConceptStep({ onNext }: { onNext?: () => void }) {
  const t = useTranslations('onboarding');

  return (
    <div className={styles.step}>
      <div className={styles.emoji} aria-hidden>
        🗺️
      </div>
      <h2 className={styles.title}>{t('concept.title')}</h2>
      <p className={styles.description}>{t('concept.description')}</p>
      <div className={`${styles.actions} ${styles.actionsCenter}`}>
        <Button variant="primary" size="lg" fullWidth onClick={onNext}>
          {t('next')}
        </Button>
      </div>
    </div>
  );
}
