import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import styles from './Button.module.scss';

/**
 * 디자인 시스템 버튼 primitive — SCSS module + variant/size/fullWidth.
 *
 * variant (Figma button 카탈로그 매핑 — style×color):
 *   - primary   : solid Green — 채움 (가장 강한 강조 — submit/CTA)
 *   - accent    : solid Accent — 오렌지 포인트 CTA
 *   - outline   : line Green — primary 보더 + primary 텍스트
 *   - secondary : line Gray — gray 보더 + muted 텍스트
 *   - ghost     : 배경/border 없음 — text-like (Figma 외 코드 전용)
 *   - danger    : 위험 액션 (삭제 confirm 등, Figma 외 코드 전용)
 *
 * size:
 *   - sm (36) / md (44, default) / lg (52)  — Figma 는 52/36 두 단계
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
export type ButtonVariant =
  | 'primary'
  | 'accent'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'danger';
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
