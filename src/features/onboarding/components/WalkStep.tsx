'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui';
import { OnboardingProgress } from './OnboardingProgress';
import styles from './WalkStep.module.scss';

/**
 * Onboarding Walk step — Figma "Walk 1·토너먼트 / Walk 2·편지 / Walk 3·도장책".
 *
 * 구조:
 *   illustArea (360h) — bg tone 별 + 232x190 SVG 일러스트 + (옵션) overlay 텍스트
 *   body (320h, padding 40 20 0, column space-between):
 *     상단: title (Title B 24 130%) + tagline (Body R 14 140%)
 *     하단: button "다음" (52h primary)
 *   * dots progress 는 OnboardingFlow 의 상위 .progress 가 처리 (이 컴포넌트
 *     에선 미렌더 — flow 전체 step 진행 표시 일관).
 *
 * SVG 는 vector — next/image 안 쓰고 native <img> (운영 첫 진입 지연 회피).
 */
export type WalkStepKind = 'tournament' | 'letter' | 'stamp';

const ILLUSTS: Record<WalkStepKind, { src: string; overlay?: string }> = {
  tournament: { src: '/images/onboarding/walk-tournament.svg', overlay: 'VS' },
  letter: { src: '/images/onboarding/walk-letter.svg' },
  stamp: { src: '/images/onboarding/walk-stamp.svg', overlay: '충북' },
};

export function WalkStep({
  kind,
  currentStep,
  totalSteps,
  onNext,
}: {
  kind: WalkStepKind;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
}) {
  const t = useTranslations(`onboarding.walk.${kind}`);
  const tNav = useTranslations('onboarding');
  const illust = ILLUSTS[kind];

  return (
    <div className={styles.step}>
      <div className={`${styles.illustArea} ${styles[`bg-${kind}`]}`}>
        <div className={styles.illust}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={illust.src}
            alt=""
            width={232}
            height={190}
            className={styles.illustImg}
          />
          {illust.overlay && (
            <span
              aria-hidden
              className={`${styles.overlay} ${styles[`overlay-${kind}`]}`}
            >
              {illust.overlay}
            </span>
          )}
        </div>
      </div>
      <div className={styles.body}>
        <div className={styles.copy}>
          <h2 className={styles.title}>{t('title')}</h2>
          <p className={styles.tagline}>{t('tagline')}</p>
        </div>
        {/* Figma 정합 — dots progress 가 button 바로 위 (gap 32). */}
        <div className={styles.foot}>
          <OnboardingProgress current={currentStep} total={totalSteps} />
          <Button variant="primary" size="lg" fullWidth onClick={onNext}>
            {tNav('next')}
          </Button>
        </div>
      </div>
    </div>
  );
}
