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
  variant = 'default',
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  /**
   * `card` — Figma 마이페이지의 `empty-saved` / `empty-recent`.
   * 섹션 안에 들어가는 흰 카드(1px, radius 12, padding 20/16) 형태로,
   * 84px 원형 아이콘과 큰 최소 높이를 쓰지 않는다.
   */
  variant?: 'default' | 'card';
}) {
  // Figma emptyItme 은 설명 유무로 규격이 갈린다.
  //   type=title : gap 16, 제목 Basic Body/B_16_140%
  //   type=desc  : gap 20, 제목 Basic Body/B_14_140% + 설명 Caption/R_12
  const withDescription = Boolean(description);
  const isCard = variant === 'card';

  return (
    <div
      className={[
        styles.wrap,
        withDescription ? styles.hasDescription : '',
        isCard ? styles.card : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* 카드형은 시안에 원형 아이콘이 없다 */}
      {icon && !isCard && <div className={styles.icon}>{icon}</div>}
      {/* Figma `f` — 제목+설명은 gap 3 의 한 블록이다. 따로 두면 wrap 의
          gap 16 이 그대로 적용돼 시안보다 훨씬 벌어진다. */}
      <div className={styles.text}>
        <h3 className={styles.title}>{title}</h3>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
