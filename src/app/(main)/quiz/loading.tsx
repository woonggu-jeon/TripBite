import { Skeleton } from '@/components/feedback/Skeleton';

/**
 * /quiz cold start fallback — progress bar + question card + 4 옵션.
 */
export default function QuizLoading() {
  return (
    <div
      style={{
        padding: 'var(--space-4)',
        display: 'grid',
        gap: 'var(--space-3)',
      }}
    >
      {/* progress segments (5문항 기준) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 6,
        }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} width="100%" height={6} radius="sm" />
        ))}
      </div>
      {/* question text */}
      <Skeleton width="90%" height={28} radius="md" />
      <Skeleton width="60%" height={20} radius="sm" />
      {/* 4 옵션 카드 */}
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} width="100%" height={56} radius="md" />
      ))}
    </div>
  );
}
