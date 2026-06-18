import { Skeleton } from '@/components/feedback/Skeleton';

/** /region — 충북 11 시군 hero(지도) + grid. */
export default function RegionLoading() {
  return (
    <div
      style={{
        padding: 'var(--space-4)',
        display: 'grid',
        gap: 'var(--space-3)',
      }}
    >
      {/* hero / map */}
      <Skeleton width="100%" height={220} radius="lg" />
      {/* 11 시군 chip grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8,
        }}
      >
        {Array.from({ length: 11 }).map((_, i) => (
          <Skeleton key={i} width="100%" height={72} radius="md" />
        ))}
      </div>
    </div>
  );
}
