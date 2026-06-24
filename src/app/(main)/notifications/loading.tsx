import { Skeleton } from '@/components/feedback/Skeleton';

/**
 * /notifications cold start fallback — NotificationsClient skeletonItem 정합.
 * 32 circle + 2 line text (80% 14 + 55% 12) × 4 row. 이전 단순 72×6 row 정정.
 */
export default function NotificationsLoading() {
  return (
    <div
      style={{
        padding: 'var(--space-4)',
        display: 'grid',
        gap: 'var(--space-3)',
      }}
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Skeleton width={32} height={32} radius="full" />
          <div style={{ flex: 1, display: 'grid', gap: 4 }}>
            <Skeleton width="80%" height={14} radius="sm" />
            <Skeleton width="55%" height={12} radius="sm" />
          </div>
        </div>
      ))}
    </div>
  );
}
