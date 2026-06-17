'use client';

import { useEffect, type ReactNode } from 'react';
import { useIntersection } from '@/hooks/use-intersection';
import { SkeletonList } from '@/components/feedback/SkeletonList';

/**
 * <InfiniteList />
 *
 * IntersectionObserver 기반 무한스크롤.
 * **virtualization 없음** — 1,000개 미만 리스트엔 충분하고 코드가 단순.
 * 진짜 큰 리스트(편지함 수만 개 등)가 생기면 @tanstack/react-virtual 추가 검토.
 *
 * 사용:
 *   <InfiniteList
 *     items={items}
 *     hasNext={hasNext}
 *     isFetchingNext={isFetchingNext}
 *     onReachEnd={fetchNext}
 *     keyExtractor={(item) => item.id}
 *     renderItem={(item) => <LetterCard letter={item} />}
 *   />
 *
 * 성능 노트:
 *   - sentinel 은 리스트 마지막 뒤에 단 1개만 추가
 *   - rootMargin: 200px — 사용자가 끝에 닿기 전 미리 prefetch → 끊김 없음
 *   - 이미 fetching 중이면 onReachEnd 호출 안 함 (useEffect의 guard)
 */
export function InfiniteList<T>({
  items,
  hasNext,
  isFetchingNext,
  onReachEnd,
  keyExtractor,
  renderItem,
  renderSkeleton,
  emptyState,
  className,
  itemGap = 12,
  skeletonCount = 3,
  columns = 1,
}: {
  items: T[];
  hasNext: boolean | undefined;
  isFetchingNext?: boolean;
  onReachEnd: () => void;
  keyExtractor: (item: T, index: number) => string | number;
  renderItem: (item: T, index: number) => ReactNode;
  /**
   * 다음 페이지 fetching 중 placeholder. 카드 모양 매치 위해 호출 측에서 제공.
   * 미지정 시 SkeletonList (기본 height 80) — row 형 list 기본값.
   */
  renderSkeleton?: () => ReactNode;
  emptyState?: ReactNode;
  className?: string;
  itemGap?: number;
  skeletonCount?: number;
  /** 그리드 열 수 — default 1 (단일 row). 2 이상이면 grid-template-columns 자동.
   *  sentinel 은 columns 만큼 span 해 그리드 마지막 row 가독성 유지. */
  columns?: number;
}) {
  const { ref, isIntersecting } = useIntersection<HTMLDivElement>();

  useEffect(() => {
    if (isIntersecting && hasNext && !isFetchingNext) {
      onReachEnd();
    }
  }, [isIntersecting, hasNext, isFetchingNext, onReachEnd]);

  if (items.length === 0 && !isFetchingNext) {
    return <>{emptyState}</>;
  }

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gap: itemGap,
    gridTemplateColumns:
      columns > 1 ? `repeat(${columns}, minmax(0, 1fr))` : undefined,
  };

  return (
    <div className={className} style={gridStyle}>
      {items.map((item, i) => (
        <div key={keyExtractor(item, i)}>{renderItem(item, i)}</div>
      ))}

      {/* 다음 페이지 fetching 중 placeholder — 카드 모양 매치 위해 호출 측 override 가능 */}
      {isFetchingNext &&
        (renderSkeleton ? (
          Array.from({ length: skeletonCount }, (_, i) => (
            <div key={`sk-${i}`}>{renderSkeleton()}</div>
          ))
        ) : (
          <SkeletonList count={skeletonCount} height={80} radius="md" />
        ))}

      {/* 마지막 페이지 후에는 sentinel 렌더 안 함.
          columns > 1 일 때 sentinel 도 전체 폭 차지하도록 column span. */}
      {hasNext && (
        <div
          ref={ref}
          aria-hidden
          style={{
            height: 1,
            gridColumn: columns > 1 ? `1 / -1` : undefined,
          }}
        />
      )}
    </div>
  );
}
