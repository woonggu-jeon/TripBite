import { Skeleton } from '@/components/feedback/Skeleton';
import styles from './DestinationCard.module.scss';

/**
 * DestinationCard 모양의 skeleton — Figma "DestinationCard 152×184" 정합.
 *
 * 카드와 동일한 외곽 (.card) + body 구조:
 *   - image aspect 152/108 자리.
 *   - body padding 12 10 gap 4 order: name (B_14) → region (pin + M_10) →
 *     description (M_10).
 *
 * 실 카드와 height 일치 → grid 안 skeleton ↔ 실 카드 전환 시 CLS 0.
 * tone prop 안 받음 — skeleton 은 톤 시각 안 함 (단순 회색).
 */
export function DestinationCardSkeleton() {
  return (
    <div className={styles.card} aria-hidden>
      {/* image — 152/108 aspect placeholder */}
      <div className={styles.image}>
        <Skeleton width="100%" height="100%" radius="sm" />
      </div>
      {/* body — Figma Frame 3 order */}
      <div className={styles.body}>
        {/* name — B_14 1 line */}
        <Skeleton width="70%" height={14} radius="sm" />
        {/* region — pin + M_10 muted */}
        <Skeleton width="40%" height={10} radius="sm" />
        {/* description — M_10 #121212 */}
        <Skeleton width="85%" height={10} radius="sm" />
      </div>
    </div>
  );
}
