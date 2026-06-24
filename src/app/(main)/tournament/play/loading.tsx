import { Skeleton } from '@/components/feedback/Skeleton';
import { SubHeaderSkeleton } from '@/components/feedback/SubHeaderSkeleton';

/**
 * /tournament/play cold start fallback — bracket phase 첫 화면 정합 (2026-06-24).
 *   - Frame 43 (progress label + segments) + B_20 round title + match-area
 *   - intro/map/tournamentSize phase 는 /tournament (setup) 으로 이동 후
 *     이 fallback 은 bracket layout placeholder 만 표시.
 */
export default function TournamentPlayLoading() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        padding: 20,
      }}
    >
      <SubHeaderSkeleton wrapPadding={20} />
      {/* Frame 43 — progress top row + segments */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Skeleton width={120} height={20} radius="sm" />
          <Skeleton width={80} height={20} radius="sm" />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ flex: 1 }}>
              <Skeleton width="100%" height={8} radius="full" />
            </div>
          ))}
        </div>
      </div>

      {/* round title B_20 */}
      <Skeleton width="60%" height={26} radius="sm" />

      {/* match-area — hero 2 stacked + VS center */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          position: 'relative',
        }}
      >
        <Skeleton width="100%" height={176} radius="lg" />
        <Skeleton width="100%" height={176} radius="lg" />
      </div>
    </div>
  );
}
