import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import styles from './ListRow.module.scss';

/**
 * ListRow primitive — list-style action button (Figma "설정" page row 정합).
 *
 * 시각:
 *   - grid 1fr auto (label group | value), padding 16/20, 1.5px border,
 *     hover border 강조, focus-visible outline.
 *   - label: Body/SB_16_140% (-0.02em).
 *   - hint (선택): label 아래 sub-text. Caption/R_12 muted (-0.01em).
 *   - value (선택): 오른쪽 정렬. Body/R_14_140% fg.
 *   - variant=danger — destructive 액션 (red label).
 *
 * 사용처:
 *   - settings/account row (닉네임/비밀번호/위치권한/차단)
 *   - settings 의 link row (언어 "한국어" / 버전 "1.0.0" 등)
 *   - hint 와 value 는 동시 사용 가능 (hint 는 label 아래, value 는 오른쪽).
 *
 * 의도적 비포함:
 *   - <Link> as 변형 — settings 외부 link 는 SCSS share (.button className)
 *     유지 (PolicySection). asChild 도입 시 SSR Hydration mismatch / a11y
 *     분기 복잡도 증가.
 *   - Toggle row — display: grid 1fr/auto 별도 패턴 (SettingsRows 의 .row).
 *     NotificationSettingsSection 내부 패턴 유지.
 *   - logout/withdraw 같은 center 정렬 button — Button.s-lg variant 사용
 *     (AccountActionsSection).
 */
export type ListRowVariant = 'default' | 'danger';

// native <button value> (form submit value) 와 우리 value (right-aligned text)
// 충돌 회피 — Omit 으로 native value 제거. ListRow 는 form submit 컨텍스트
// 외 사용을 가정 (settings row 등).
interface ListRowProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'value'
> {
  /** row 라벨 (왼쪽). */
  children: ReactNode;
  /** label 아래 sub-text (Caption muted). 위치 권한 안내 등. */
  hint?: ReactNode;
  /** 오른쪽 정렬 텍스트 (Body R 14). 언어 / 버전 / 권한 상태 등. */
  value?: ReactNode;
  /** danger 톤 — 회원 탈퇴 등 destructive 액션. */
  variant?: ListRowVariant;
}

export const ListRow = forwardRef<HTMLButtonElement, ListRowProps>(
  function ListRow(
    { children, hint, value, variant = 'default', className, type, ...rest },
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
        <div className={styles.labelGroup}>
          <div>{children}</div>
          {hint != null && <div className={styles.hint}>{hint}</div>}
        </div>
        {value != null && <div className={styles.value}>{value}</div>}
      </button>
    );
  },
);
