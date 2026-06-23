import type { ReactNode } from 'react';
import styles from './EmptyState.module.scss';

/**
 * 빈 상태 표준 컴포넌트
 *
 * 사용처 (메뉴 사이트맵상):
 *   - 편지함 (받은/보낸/좋아요/저장 — 4탭 × 4 EmptyState)
 *   - 토너먼트 우승지 저장 (0개일 때 첫 토너먼트 CTA)
 *   - 토너먼트 기록
 *   - 알림함 (variant="hero" — Figma "ec frame" 정합)
 *   - 시군 상세 탭 (관광지/축제/체험 데이터 없을 때)
 *
 * variant:
 *   - default — 56 circle + muted (작은 inline / list 안 empty)
 *   - hero — 84 circle + primary-soft bg + primary icon color (Figma
 *     "ec frame" 2026-06-23 — 알림 빈 상태 전용 큰 시각)
 *
 * 일관된 UX:
 *   - 아이콘 + 타이틀 + 설명 + (선택) 액션 버튼
 *   - CLS 방지를 위해 사용처에서 최소 높이 보장
 *
 * Server Component — 인터랙션은 action prop으로 외부 주입.
 */
export type EmptyStateVariant = 'default' | 'hero';

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = 'default',
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  variant?: EmptyStateVariant;
  className?: string;
}) {
  const wrapCls = [
    styles.wrap,
    variant === 'hero' ? styles.heroWrap : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');
  const iconCls = [styles.icon, variant === 'hero' ? styles.heroIcon : null]
    .filter(Boolean)
    .join(' ');
  const titleCls = [styles.title, variant === 'hero' ? styles.heroTitle : null]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={wrapCls}>
      {icon && <div className={iconCls}>{icon}</div>}
      <h3 className={titleCls}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
