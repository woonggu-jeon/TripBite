import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import styles from './ListRow.module.scss';

/**
 * ListRow primitive — list-style action button.
 *
 * 사용처: settings 페이지 (계정/액션) row, 그 외 list 패턴 action.
 *   - 시각: full-width, text-align left, 1.5px border, hover border 강조.
 *   - variant=default — 기본 fg
 *   - variant=danger — 회원 탈퇴 등 destructive 액션 (red text)
 *   - hint — row 라벨 아래 보조 텍스트 (예: 위치 권한 상태).
 *
 * 의도적 비포함:
 *   - <Link> as 변형 — settings 외부 link 는 className 으로 본 module 의
 *     listRowClasses() 헬퍼 사용 (또는 자체 styling). primitive 는 button
 *     element 에 집중 (asChild 도입 시 SSR Hydration mismatch / a11y 분기
 *     복잡도 증가).
 *   - Toggle row — display: grid 1fr/auto 별도 패턴 (SettingsRows 의 .row).
 *     NotificationSettingsSection 내부 패턴 유지.
 */
export type ListRowVariant = 'default' | 'danger';

interface ListRowProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** row 본문 (label). hint 없을 땐 단일 텍스트, 있을 땐 fragment 또는 string. */
  children: ReactNode;
  /** label 아래 보조 텍스트 (선택). caption muted 톤. */
  hint?: ReactNode;
  /** danger 톤 — 회원 탈퇴 등 destructive 액션. */
  variant?: ListRowVariant;
}

export const ListRow = forwardRef<HTMLButtonElement, ListRowProps>(
  function ListRow(
    { children, hint, variant = 'default', className, type, ...rest },
    ref,
  ) {
    const cls = [
      styles.row,
      variant === 'danger' ? styles.danger : null,
      className,
    ]
      .filter(Boolean)
      .join(' ');
    return (
      <button ref={ref} type={type ?? 'button'} className={cls} {...rest}>
        <div>{children}</div>
        {hint != null && <div className={styles.hint}>{hint}</div>}
      </button>
    );
  },
);
