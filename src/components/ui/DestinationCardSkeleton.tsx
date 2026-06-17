import { Skeleton } from '@/components/feedback/Skeleton';
import styles from './DestinationCard.module.scss';

/**
 * DestinationCard 모양의 skeleton.
 *
 * 카드와 동일한 외곽 (.card) + body 구조 — image aspect-square 자리 +
 * region eyebrow + name (3줄 min) + description (1줄). 실 카드와 높이/너비/
 * gap 정확히 일치 → grid 안에서 skeleton ↔ 실 카드 전환 시 CLS 0.
 *
 * tone prop 안 받음 — skeleton 은 톤 시각 안 함 (단순 회색).
 */
export function DestinationCardSkeleton() {
  return (
    <div className={styles.card} aria-hidden>
      {/* image placeholder — DestinationCard.image 와 같은 aspect-ratio */}
      <div className={styles.image}>
        <Skeleton width="100%" height="100%" radius="sm" />
      </div>
      <div className={styles.body}>
        {/* region eyebrow */}
        <Skeleton width="40%" height={10} radius="sm" />
        {/* name — 3줄 min-height 영역 reserved (DestinationCard.name 과 동일) */}
        <div className={styles.name}>
          <Skeleton width="80%" height={13} radius="sm" />
        </div>
        {/* description — 1줄 (nbsp reserve 영역과 동일) */}
        <Skeleton width="70%" height={10} radius="sm" />
      </div>
    </div>
  );
}
