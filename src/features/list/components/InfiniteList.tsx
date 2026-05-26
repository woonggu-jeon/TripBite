'use client';

import { useEffect, type ReactNode } from 'react';
import { useIntersection } from '@/hooks/use-intersection';
import { Skeleton } from '@/components/feedback/Skeleton';

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
  emptyState,
  className,
  itemGap = 12,
  skeletonCount = 3,
}: {
  items: T[];
  hasNext: boolean | undefined;
  isFetchingNext?: boolean;
  onReachEnd: () => void;
  keyExtractor: (item: T, index: number) => string | number;
  renderItem: (item: T, index: number) => ReactNode;
  emptyState?: ReactNode;
  className?: string;
  itemGap?: number;
  skeletonCount?: number;
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

  return (
    <div
      className={className}
      style={{ display: 'grid', gap: itemGap }}
    >
      {items.map((item, i) => (
        <div key={keyExtractor(item, i)}>{renderItem(item, i)}</div>
      ))}

      {/* 다음 페이지 fetching 중 placeholder */}
      {isFetchingNext &&
        Array.from({ length: skeletonCount }).map((_, i) => (
          <Skeleton key={`s-${i}`} width="100%" height={80} radius="md" />
        ))}

      {/* 마지막 페이지 후에는 sentinel 렌더 안 함 */}
      {hasNext && <div ref={ref} aria-hidden style={{ height: 1 }} />}
    </div>
  );
}
