import { Skeleton } from '@/components/feedback/Skeleton';
import { SubHeaderSkeleton } from '@/components/feedback/SubHeaderSkeleton';

/**
 * /mypage/saved-tournaments cold start fallback — SavedTournamentsAll
 * isLoading 분기 정합.
 *   - wrap: padding 20 gap 12
 *   - grid 2cols gap var(--space-3), 6 cells height 180
 */
export default function SavedTournamentsLoading() {
  return (
    <div
      style={{
        display: 'grid',
        gap: 12,
        padding: 20,
      }}
    >
      <SubHeaderSkeleton wrapPadding={20} />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 'var(--space-3)',
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} width="100%" height={180} radius="md" />
        ))}
      </div>
    </div>
  );
}
