import { Skeleton } from '@/components/feedback/Skeleton';
import { SubHeaderSkeleton } from '@/components/feedback/SubHeaderSkeleton';

/**
 * /destination/[id] cold start fallback — Figma "POI · 장소상세" layout 과
 * 동일 placeholder.
 *
 * DestinationDetailClient 의 isLoading 분기와 같은 markup → loading → mount
 * → data 전환 시 skeleton 가 같은 모양 유지하여 "2번 깜빡임" 회피 (CLS 0).
 *
 * 구조 (contentInner padding 16 무시 → margin -16):
 *   - hero 234 (풀폭).
 *   - info-sec padding 20 20 24 white bg:
 *     · title-area row (60% + 40% + chip 72×25 pill placeholder).
 *     · info-card 5 row × 18h.
 *     · divider 1px.
 *     · overview 80h.
 *   - near-sec padding 20 white bg:
 *     · sec-title 40%.
 *     · 3 card 152×168 row.
 */
export default function DestinationDetailLoading() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-surface-soft)',
        margin: '0 calc(-1 * var(--content-pad))',
      }}
    >
      <SubHeaderSkeleton />
      {/* DestinationPhotos hero — aspect-ratio 360/234 (component 와 동일 grow). */}
      <Skeleton width="100%" radius="sm" style={{ aspectRatio: '360 / 234' }} />

      {/* info-sec — padding 20 20 24 gap 20 white */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          padding: '20px 20px 24px',
          background: 'var(--color-bg)',
        }}
      >
        {/* title-area row */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 10,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              flex: 1,
            }}
          >
            <Skeleton width="60%" height={26} radius="sm" />
            <Skeleton width="40%" height={20} radius="sm" />
          </div>
          <Skeleton width={72} height={25} radius="full" />
        </div>

        {/* info-card 5 row */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} width="100%" height={18} radius="sm" />
          ))}
        </div>

        {/* divider */}
        <div
          style={{
            width: '100%',
            height: 1,
            background: 'var(--color-border)',
          }}
          aria-hidden
        />

        {/* overview 80 */}
        <Skeleton width="100%" height={80} radius="sm" />
      </div>

      {/* near-sec — padding 20 white */}
      <div style={{ padding: 20, background: 'var(--color-bg)' }}>
        <Skeleton width="40%" height={22} radius="sm" />
        <div
          style={{ display: 'flex', gap: 8, marginTop: 12, overflow: 'hidden' }}
        >
          <Skeleton width={152} height={168} radius="md" />
          <Skeleton width={152} height={168} radius="md" />
          <Skeleton width={152} height={168} radius="md" />
        </div>
      </div>
    </div>
  );
}
