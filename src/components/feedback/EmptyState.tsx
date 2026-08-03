import type { ReactNode } from 'react';
import styles from './EmptyState.module.scss';

/**
 * 빈 상태 표준 컴포넌트
 *
 * 사용처 (메뉴 사이트맵상):
 *   - 편지함 (받은/보낸/좋아요/저장 — 4탭 × 4 EmptyState)
 *   - 토너먼트 우승지 저장 (0개일 때 첫 토너먼트 CTA)
 *   - 토너먼트 기록
 *   - 알림함
 *   - 시군 상세 탭 (관광지/축제/체험 데이터 없을 때)
 *   - 차단 사용자 목록
 *
 * 일관된 UX:
 *   - 아이콘 + 타이틀 + 설명 + (선택) 액션 버튼
 *   - CLS 방지를 위해 사용처에서 최소 높이 보장
 *
 * Server Component — 인터랙션은 action prop으로 외부 주입.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  // Figma emptyItme 은 설명 유무로 규격이 갈린다.
  //   type=title : gap 16, 제목 Basic Body/B_16_140%
  //   type=desc  : gap 20, 제목 Basic Body/B_14_140% + 설명 Caption/R_12
  const withDescription = Boolean(description);

  return (
    <div
      className={[
        styles.wrap,
        withDescription ? styles.hasDescription : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {icon && <div className={styles.icon}>{icon}</div>}
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
