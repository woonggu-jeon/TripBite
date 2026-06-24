import type { CSSProperties } from 'react';
import styles from './Skeleton.module.scss';

/**
 * 범용 Skeleton
 *
 * 사용처:
 *   - 동적 import의 loading fallback
 *   - Suspense fallback
 *   - 데이터 로딩 중 자리잡이
 *
 * 성능 노트:
 *   - 순수 SCSS 애니메이션 (JS 부담 없음)
 *   - prefers-reduced-motion 존중
 *
 * style prop — aspect-ratio 등 추가 layout 지정 (2026-06-24 추가). aspect-ratio
 * 가 width 와 결합 시 height 자동 계산 → desktop 폭 grow 시 비율 유지.
 */
export function Skeleton({
  width,
  height,
  radius = 'md',
  className,
  style,
}: {
  width?: number | string;
  height?: number | string;
  radius?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`${styles.skeleton} ${styles[`radius-${radius}`]} ${className ?? ''}`}
      style={{ width, height, ...style }}
      aria-hidden="true"
    />
  );
}
