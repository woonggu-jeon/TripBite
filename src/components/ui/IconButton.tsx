import { Loader2 } from 'lucide-react';
import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from 'react';
import styles from './IconButton.module.scss';

/**
 * 아이콘 전용 버튼 primitive — 헤더, 카드, 리스트 끝 등 정사각 hit target.
 *
 * variant:
 *   - ghost   : 배경 없음, hover 시 hover token (기본)
 *   - solid   : primary 채움
 *   - outline : border + 투명 배경
 *
 * size: sm(32) / md(40, default) / lg(44)
 *
 * aria-label 필수 — 아이콘만 있는 버튼은 스크린리더에 의미 전달 필요.
 *
 * loading prop — Button primitive 와 일관성 (2026-06-19 audit). spinner
 * (Loader2) 로 children 대체 + disabled + aria-busy. 옵션 (backward compat).
 */
export type IconButtonVariant = 'ghost' | 'solid' | 'outline';
export type IconButtonSize = 'sm' | 'md' | 'lg';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  'aria-label': string;
  children: ReactNode;
  /** 로딩 중 spinner 노출 + disabled + aria-busy. Button primitive 정합. */
  loading?: boolean;
}

const SPINNER_SIZE: Record<IconButtonSize, number> = { sm: 14, md: 16, lg: 18 };

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    {
      variant = 'ghost',
      size = 'md',
      className,
      children,
      type,
      loading,
      disabled,
      ...rest
    },
    ref,
  ) {
    const cls = [
      styles.btn,
      styles[`v-${variant}`],
      styles[`s-${size}`],
      className,
    ]
      .filter(Boolean)
      .join(' ');
    return (
      <button
        ref={ref}
        type={type ?? 'button'}
        className={cls}
        disabled={loading || disabled}
        aria-busy={loading || undefined}
        {...rest}
      >
        {loading ? <Loader2 size={SPINNER_SIZE[size]} aria-hidden /> : children}
      </button>
    );
  },
);
