import type { ReactNode } from 'react';
import styles from './Chip.module.scss';

/**
 * 칩/배지 primitive — tag, status, count 등 작은 라벨 일관 처리.
 *
 * variant:
 *   - default : 회색 chip (border-only)
 *   - primary : primary-tint 배경 + primary 텍스트
 *   - outline : primary-border + 투명 배경 (강조 keyword tag)
 *   - subtle  : surface-soft 배경 + muted 텍스트
 *   - solid   : primary 채움 (대표 강조)
 *
 * size:
 *   - xs : 최소형 badge — NEW / HOT 같은 inline 라벨 (10px)
 *   - sm : 작은 chip (#태그용)
 *   - md : 기본
 *
 * pill: 기본 true (radius-full). false 시 radius-md.
 */
export type ChipVariant =
  | 'default'
  | 'primary'
  | 'outline'
  | 'subtle'
  | 'solid';
export type ChipSize = 'xs' | 'sm' | 'md';

interface ChipProps {
  variant?: ChipVariant;
  size?: ChipSize;
  pill?: boolean;
  className?: string;
  'aria-label'?: string;
  children: ReactNode;
}

export function Chip({
  variant = 'default',
  size = 'md',
  pill = true,
  className,
  'aria-label': ariaLabel,
  children,
}: ChipProps) {
  const cls = [
    styles.chip,
    styles[`v-${variant}`],
    styles[`s-${size}`],
    pill ? styles.pill : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <span className={cls} aria-label={ariaLabel}>
      {children}
    </span>
  );
}
