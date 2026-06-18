import { Skeleton } from '@/components/feedback/Skeleton';

/** /letter/sent — 보낸 편지 list. */
export default function LetterSentLoading() {
  return (
    <div
      style={{
        padding: 'var(--space-4)',
        display: 'grid',
        gap: 'var(--space-2)',
      }}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} width="100%" height={84} radius="md" />
      ))}
    </div>
  );
}
