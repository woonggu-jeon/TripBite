import { Skeleton } from '@/components/feedback/Skeleton';

/** /mypage/saved-tournaments — 저장된 우승지 grid (2 columns). */
export default function SavedTournamentsLoading() {
  return (
    <div
      style={{
        padding: 'var(--space-4)',
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: 'var(--space-3)',
      }}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} width="100%" height={220} radius="md" />
      ))}
    </div>
  );
}
