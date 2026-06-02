'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui';
import styles from './OnboardingStep.module.scss';
import conceptIllustrationStyles from './ConceptIllustration.module.scss';

/**
 * <ConceptStep /> — 온보딩 step 1
 *
 * 컨셉 소개. 정적 UI + 다음 버튼.
 *
 * 일러스트: SVG inline (시즌 그라데이션 + 충북 지도 추상 + emoji).
 * 디자이너 시안 받으면 `<ConceptIllustration />` JSX 만 교체.
 */
export function ConceptStep({ onNext }: { onNext?: () => void }) {
  const t = useTranslations('onboarding');

  return (
    <div className={styles.step}>
      <ConceptIllustration />
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

/**
 * 충북 추상 일러스트 — 시즌 그라데이션 배경 + 산 실루엣 + 큰 emoji.
 * 디자이너 시안 받으면 SVG asset 으로 교체.
 */
function ConceptIllustration() {
  return (
    <div className={conceptIllustrationStyles.wrap} aria-hidden>
      <svg
        viewBox="0 0 240 200"
        xmlns="http://www.w3.org/2000/svg"
        className={conceptIllustrationStyles.svg}
      >
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-spring-grad-start)" />
            <stop offset="100%" stopColor="var(--accent-spring-grad-end)" />
          </linearGradient>
          <linearGradient id="mountain1" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-primary)"
              stopOpacity="0.85"
            />
            <stop
              offset="100%"
              stopColor="var(--color-primary)"
              stopOpacity="0.55"
            />
          </linearGradient>
          <linearGradient id="mountain2" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-primary)"
              stopOpacity="0.5"
            />
            <stop
              offset="100%"
              stopColor="var(--color-primary)"
              stopOpacity="0.25"
            />
          </linearGradient>
        </defs>
        <rect width="240" height="200" rx="20" fill="url(#sky)" />
        {/* 뒤편 산 */}
        <path
          d="M0,140 L40,90 L80,120 L120,80 L160,110 L200,75 L240,105 L240,200 L0,200 Z"
          fill="url(#mountain2)"
        />
        {/* 앞쪽 산 */}
        <path
          d="M0,170 L30,130 L70,150 L110,120 L150,145 L190,115 L240,140 L240,200 L0,200 Z"
          fill="url(#mountain1)"
        />
        {/* 해 */}
        <circle
          cx="190"
          cy="55"
          r="22"
          fill="var(--accent-autumn)"
          opacity="0.9"
        />
      </svg>
      <span className={conceptIllustrationStyles.emoji}>🗺️</span>
    </div>
  );
}
