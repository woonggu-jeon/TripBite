import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import styles from './Button.module.scss';

/**
 * 디자인 시스템 버튼 primitive — SCSS module + variant/size/fullWidth.
 *
 * variant:
 *   - primary   : 채움 (가장 강한 강조 — submit/CTA)
 *   - secondary : border + 투명 배경
 *   - ghost     : 배경/border 없음 — text-like
 *   - danger    : 위험 액션 (삭제 confirm 등)
 *
 * size:
 *   - sm (32) / md (44, default) / lg (52)  — 모바일 hit target 44px 보장
 *
 * fullWidth: 부모 너비 100%
 *
 * loading: 로딩 중엔 disabled + aria-busy. 텍스트는 호출부가 변경 (예: '저장 중...')
 *
 * 사용 가이드:
 *   <Button variant="primary" type="submit" fullWidth>{label}</Button>
 *   <Button variant="ghost" size="sm" leadingIcon={<Icon />}>...</Button>
 *
 * 기존 컴포넌트의 .primary/.secondary 클래스 대체용. 자체 SCSS 의 padding/radius/
 * transition 반복 제거.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      size = 'md',
      fullWidth,
      loading,
      leadingIcon,
      trailingIcon,
      className,
      children,
      type,
      disabled,
      ...rest
    },
    ref,
  ) {
    const cls = [
      styles.btn,
      styles[`v-${variant}`],
      styles[`s-${size}`],
      fullWidth ? styles.fullWidth : '',
      loading ? styles.loading : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');
    return (
      <button
        ref={ref}
        type={type ?? 'button'}
        className={cls}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...rest}
      >
        {leadingIcon && <span className={styles.icon}>{leadingIcon}</span>}
        <span className={styles.label}>{children}</span>
        {trailingIcon && <span className={styles.icon}>{trailingIcon}</span>}
      </button>
    );
  },
);

/**
 * Button 스타일만 필요할 때 — Next/Link 처럼 polymorphic 으로 받기 어려운
 * 컴포넌트에 className 으로 직접 적용. Button primitive 와 동일한 클래스 매핑.
 * (Card 의 `cardClasses` 와 같은 idiom)
 *
 *   <Link className={buttonClasses({ variant: 'primary', size: 'lg', fullWidth: true })}>
 */
export function buttonClasses({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
} = {}): string {
  return [
    styles.btn,
    styles[`v-${variant}`],
    styles[`s-${size}`],
    fullWidth ? styles.fullWidth : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}
