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
  return (
    <Tag className={cardClasses({ variant, padding, className })} {...rest}>
      {children}
    </Tag>
  );
}

/**
 * Card 스타일만 필요할 때 — Next/Link 처럼 polymorphic 으로 받기 어려운 컴포넌트에
 * className 으로 직접 적용. Card primitive 와 동일한 SCSS 클래스 매핑.
 *
 *   <Link className={cardClasses({ variant: 'surface' })}>...</Link>
 */
export function cardClasses({
  variant = 'surface',
  padding,
  className,
}: {
  variant?: CardVariant;
  padding?: CardPadding;
  className?: string;
} = {}): string {
  // padding 미명시 시 .p-* 클래스 미추가 — module 의 .card 가 padding 을
  // 직접 명시하는 패턴에서 conflict 회피. 두 .card 클래스가 다른 module 의
  // SCSS chunk 로 로드될 때 source order 가 뒤집히면 padding 이 0 으로
  // 떨어져 카드가 찌그러지던 증상 (tournament → tournament/play → 뒤로가기
  // → tournament) 의 근본 원인.
  return [
    styles.card,
    styles[`v-${variant}`],
    padding ? styles[`p-${padding}`] : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');
}
