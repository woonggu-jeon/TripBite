import { Skeleton } from '@/components/feedback/Skeleton';
import { SubHeaderSkeleton } from '@/components/feedback/SubHeaderSkeleton';

/**
 * /region cold start fallback — RegionMapClient layout 정합.
 *
 * 구조 (RegionMapClient.module.scss `.wrap` gap var(--space-6)):
 *   - ChungbukStampMap placeholder — aspect-ratio 800/903 max-height 480.
 *     실제 컴포넌트는 SVG 정밀 지도. 동일 max-height 480 fixed로 cold ↔ mount
 *     전환 시 CLS 0.
 *   - 보조 list — auto-fill minmax(96px, 1fr) grid, 11개 chip row.
 *     ChungbukStampMap mount 시 SVG 가 즉시 paint 되므로 list 만 fetch 필요 X.
 */
export default function RegionLoading() {
  return (
    <div
      style={{
        display: 'grid',
        gap: 'var(--space-6)',
      }}
    >
      <SubHeaderSkeleton />
      {/* ChungbukStampMap placeholder — 480 max-height 정합. */}
      <Skeleton width="100%" height={480} radius="md" />

      {/* 보조 list — 11 시군 chip grid, auto-fill 96px. */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
          gap: 'var(--space-2)',
        }}
      >
        {Array.from({ length: 11 }).map((_, i) => (
          <Skeleton key={i} width="100%" height={44} radius="md" />
        ))}
      </div>
    </div>
  );
}
