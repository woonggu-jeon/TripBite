import { Skeleton } from '@/components/feedback/Skeleton';

/** /mypage/stamps — 11 시군 도장책 (지도 + 시군 chip grid). */
export default function StampsLoading() {
  return (
    <div
      style={{
        padding: 'var(--space-4)',
        display: 'grid',
        gap: 'var(--space-3)',
      }}
    >
      {/* progress (방문 카운트) */}
      <Skeleton width="60%" height={24} radius="md" />
      {/* 충북 지도 영역 */}
      <Skeleton width="100%" height={280} radius="lg" />
      {/* 11 시군 chip grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8,
        }}
      >
        {Array.from({ length: 11 }).map((_, i) => (
          <Skeleton key={i} width="100%" height={48} radius="md" />
        ))}
      </div>
    </div>
  );
}
