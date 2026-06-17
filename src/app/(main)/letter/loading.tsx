import { Skeleton } from '@/components/feedback/Skeleton';

/**
 * /letter cold start fallback — 4 tab (received/sent/liked/saved) + list.
 */
export default function LetterLoading() {
  return (
    <div
      style={{
        padding: 'var(--space-4)',
        display: 'grid',
        gap: 'var(--space-3)',
      }}
    >
      {/* 4 tab segment */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 8,
        }}
      >
        <Skeleton width="100%" height={36} radius="md" />
        <Skeleton width="100%" height={36} radius="md" />
        <Skeleton width="100%" height={36} radius="md" />
        <Skeleton width="100%" height={36} radius="md" />
      </div>
      {/* letter rows */}
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} width="100%" height={84} radius="md" />
      ))}
    </div>
  );
}
