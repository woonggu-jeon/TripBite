import { Skeleton } from '@/components/feedback/Skeleton';

/** /quiz/result — 결과 hero (emoji + 유형명) + 추천 3 카드 + actions. */
export default function QuizResultLoading() {
  return (
    <div
      style={{
        padding: 'var(--space-4)',
        display: 'grid',
        gap: 'var(--space-4)',
      }}
    >
      {/* 결과 hero */}
      <div
        style={{
          display: 'grid',
          gap: 'var(--space-2)',
          placeItems: 'center',
          padding: 'var(--space-4)',
        }}
      >
        <Skeleton width={96} height={96} radius="full" />
        <Skeleton width="50%" height={28} radius="md" />
        <Skeleton width="70%" height={16} radius="sm" />
        {/* keyword chips */}
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <Skeleton width={64} height={24} radius="full" />
          <Skeleton width={64} height={24} radius="full" />
          <Skeleton width={64} height={24} radius="full" />
        </div>
      </div>
      {/* 추천 3 카드 grid */}
      <Skeleton width="40%" height={20} radius="sm" />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 8,
        }}
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} width="100%" height={180} radius="md" />
        ))}
      </div>
      {/* actions (share / retest) */}
      <div style={{ display: 'flex', gap: 8 }}>
        <Skeleton width="100%" height={48} radius="md" />
        <Skeleton width="100%" height={48} radius="md" />
      </div>
    </div>
  );
}
