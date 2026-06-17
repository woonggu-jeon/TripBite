import { Skeleton } from '@/components/feedback/Skeleton';

/**
 * /notifications cold start fallback — SubHeader + inbox list (row 카드 5개).
 */
export default function NotificationsLoading() {
  return (
    <div
      style={{
        padding: 'var(--space-4)',
        display: 'grid',
        gap: 'var(--space-2)',
      }}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} width="100%" height={72} radius="md" />
      ))}
    </div>
  );
}
