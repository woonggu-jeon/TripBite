import { Skeleton } from '@/components/feedback/Skeleton';
import styles from './DestinationCard.module.scss';

/**
 * DestinationCard 모양의 skeleton.
 *
 * 실 카드와 동일한 외곽 (.card) + 같은 구조 — 이미지 38/27 자리 + 제목 1줄 +
 * 핀/시군 1줄. 높이/너비/gap 이 정확히 일치해 grid 안에서 skeleton ↔ 실 카드
 * 전환 시 CLS 0.
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
        {/* 제목 (14px) */}
        <Skeleton width="80%" height={20} radius="sm" />
        {/* 핀 + 시군 (10px) */}
        <Skeleton width="45%" height={12} radius="sm" />
      </div>
    </div>
  );
}
