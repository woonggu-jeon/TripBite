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
 */
export function Skeleton({
  width,
  height,
  radius = 'md',
  className,
}: {
  width?: number | string;
  height?: number | string;
  radius?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}) {
  return (
    <div
      className={`${styles.skeleton} ${styles[`radius-${radius}`]} ${className ?? ''}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}
