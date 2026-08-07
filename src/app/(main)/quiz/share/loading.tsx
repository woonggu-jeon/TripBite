import { Skeleton } from '@/components/feedback/Skeleton';

/** /quiz/share — 공유 카드 preview + actions. */
export default function QuizShareLoading() {
  return (
    <div
      style={{
        padding: 'var(--space-4)',
        display: 'grid',
        gap: 'var(--space-3)',
        placeItems: 'center',
      }}
    >
      {/* 1080×1080 og 카드 preview (mobile width 만큼 scale) */}
      <Skeleton width="100%" height={320} radius="lg" />
      {/* actions */}
      <Skeleton width="100%" height={48} radius="md" />
      <Skeleton width="60%" height={16} radius="sm" />
    </div>
  );
}
