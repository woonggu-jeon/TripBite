import type { ElementType, ReactNode } from 'react';
import styles from './Card.module.scss';

/**
 * 디자인 시스템 카드 primitive — SCSS module + variant/padding prop.
 *
 * 사용 가이드:
 *   <Card variant="surface" padding="md">…</Card>
 *
 * variant:
 *   - surface     : 기본 카드 (bg + border + radius-lg)
 *   - soft        : surface-soft 배경 (정보 박스/스킴 카드)
 *   - elevated    : 카드 강조 (shadow-card-strong)
 *   - highlighted : primary 강조 (그라데이션 + primary-border)
 *
 * padding:
 *   - none / sm / md(default) / lg
 *
 * as: section/article 등으로 시멘틱 변경 가능. 기본 div.
 *
 * 추가 className 으로 확장 가능 (gap/grid 등 레이아웃 책임은 호출부).
 */
export type CardVariant = 'surface' | 'soft' | 'elevated' | 'highlighted';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps {
  variant?: CardVariant;
  padding?: CardPadding;
  as?: ElementType;
  className?: string;
  children: ReactNode;
  'aria-label'?: string;
  role?: string;
}

export function Card({
  variant = 'surface',
  padding = 'md',
  as: Tag = 'div',
  className,
  children,
  ...rest
}: CardProps) {
  const cls = [
    styles.card,
    styles[`v-${variant}`],
    styles[`p-${padding}`],
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <Tag className={cls} {...rest}>
      {children}
    </Tag>
  );
}
