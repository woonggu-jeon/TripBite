'use client';

import styles from './OnboardingProgress.module.scss';

/**
 * Onboarding 4 step dots progress — Figma "Walk 1/2/3 + 위치권한".
 *
 *   8x8 round (border) + 22x8 pill (active primary). 가운데 정렬, gap 7.
 *   각 step 의 button 바로 위 (gap 32) 배치 — OnboardingFlow 가 step 별
 *   currentStep 전달, step 컴포넌트 (WalkStep/LocationStep) 가 본인 layout
 *   안에서 렌더.
 */
export function OnboardingProgress({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <div
      className={styles.progress}
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-label={`Step ${current}/${total}`}
    >
      {Array.from({ length: total }).map((_, i) => {
        const n = i + 1;
        return (
          <span
            key={n}
            aria-hidden
            className={`${styles.dot} ${n === current ? styles.dotActive : ''}`}
          />
        );
      })}
    </div>
  );
}
