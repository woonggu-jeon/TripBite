import { Skeleton } from '@/components/feedback/Skeleton';

/**
 * /letter/[id] cold start fallback — LetterDetailClient isLoading 분기 정합.
 * 64 notice + 320 letter + 68 actions (3 block).
 */
export default function LetterDetailLoading() {
  return (
    <div
      style={{
        padding: 'var(--space-4)',
        display: 'grid',
        gap: 'var(--space-3)',
      }}
    >
      <Skeleton width="100%" height={64} radius="lg" />
      <Skeleton width="100%" height={320} radius="lg" />
      <Skeleton width="100%" height={68} radius="md" />
    </div>
  );
}
