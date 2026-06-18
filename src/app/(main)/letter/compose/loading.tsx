import { Skeleton } from '@/components/feedback/Skeleton';

/** /letter/compose — 위치 chip + textarea + submit. */
export default function LetterComposeLoading() {
  return (
    <div
      style={{
        padding: 'var(--space-4)',
        display: 'grid',
        gap: 'var(--space-3)',
      }}
    >
      {/* location row */}
      <Skeleton width="60%" height={32} radius="full" />
      {/* textarea (5자 편지) */}
      <Skeleton width="100%" height={140} radius="md" />
      {/* counter / anonymous toggle */}
      <Skeleton width="40%" height={16} radius="sm" />
      {/* submit button */}
      <Skeleton width="100%" height={48} radius="md" />
    </div>
  );
}
