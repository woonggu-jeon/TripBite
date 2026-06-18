import { Skeleton } from '@/components/feedback/Skeleton';

/** /letter/[id] — 편지 상세 (작성자 라인 + body + actions). */
export default function LetterDetailLoading() {
  return (
    <div
      style={{
        padding: 'var(--space-4)',
        display: 'grid',
        gap: 'var(--space-3)',
      }}
    >
      {/* author line */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Skeleton width={32} height={32} radius="full" />
        <Skeleton width="40%" height={16} radius="sm" />
      </div>
      {/* body (5자 편지지만 카드 크게) */}
      <Skeleton width="100%" height={160} radius="lg" />
      {/* actions (like / save / share / delete) */}
      <div style={{ display: 'flex', gap: 8 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} width={48} height={48} radius="full" />
        ))}
      </div>
    </div>
  );
}
