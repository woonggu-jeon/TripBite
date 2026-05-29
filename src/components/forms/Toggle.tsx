'use client';

import { haptic } from '@/lib/haptic';
import styles from './Toggle.module.scss';

/**
 * ARIA switch (role="switch") 토글.
 * - 좌측 라벨/힌트는 호출자가 둘러싸는 row 안에 직접 표시.
 * - 키보드: Space/Enter 로 토글 (button 기본 동작).
 * - prefers-reduced-motion 대응.
 */
export interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  /** aria-label 또는 aria-labelledby 둘 중 하나 */
  ariaLabel?: string;
  ariaLabelledBy?: string;
}

export function Toggle({
  checked,
  onChange,
  disabled = false,
  ariaLabel,
  ariaLabelledBy,
}: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        haptic.tap();
        onChange(!checked);
      }}
      className={`${styles.track} ${checked ? styles.on : ''}`}
    >
      <span className={styles.knob} aria-hidden />
    </button>
  );
}
