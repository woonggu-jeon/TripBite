import { Skeleton } from '@/components/feedback/Skeleton';

/**
 * /ranking cold start fallback — Top5 큰 카드 + list rows.
 */
export default function RankingLoading() {
  return (
    <div
      style={{
        padding: 'var(--space-4)',
        display: 'grid',
        gap: 'var(--space-3)',
      }}
    >
      {/* Top5 hero card */}
      <Skeleton width="100%" height={180} radius="lg" />
      {/* section title */}
      <Skeleton width="40%" height={20} radius="sm" />
      {/* rank list */}
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} width="100%" height={72} radius="md" />
      ))}
    </div>
  );
}
