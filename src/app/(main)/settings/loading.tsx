import { Skeleton } from '@/components/feedback/Skeleton';
import { SubHeaderSkeleton } from '@/components/feedback/SubHeaderSkeleton';

/**
 * /settings cold start fallback — Figma "설정" page 정합.
 *
 * 구조:
 *   - SubHeader 56h (skeleton)
 *   - bl heading × 2 — padding 26 0 8 20, SB_14 fg "알림" / "계정"
 *   - row × 3 (each) — 360 풀너비 padding 16 20
 *   - bw bottom — padding 20 gap 12, logout button + withdraw text
 */
export default function SettingsLoading() {
  return (
    <div
      style={{
        marginLeft: 'calc(-1 * var(--content-pad))',
        marginRight: 'calc(-1 * var(--content-pad))',
      }}
    >
      <SubHeaderSkeleton />
      {/* bl "알림" */}
      <div style={{ padding: '26px 0 8px 20px' }}>
        <Skeleton width={48} height={14} radius="sm" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={`n-${i}`} style={{ padding: '16px 20px' }}>
          <Skeleton width="100%" height={40} radius="sm" />
        </div>
      ))}

      {/* bl "계정" */}
      <div style={{ padding: '26px 0 8px 20px' }}>
        <Skeleton width={64} height={14} radius="sm" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={`a-${i}`} style={{ padding: '16px 20px' }}>
          <Skeleton width="100%" height={22} radius="sm" />
        </div>
      ))}

      {/* bw — padding 20 gap 12, logout button + withdraw text */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: 'var(--space-5)',
          gap: 'var(--space-3)',
        }}
      >
        <Skeleton width="100%" height={52} radius="md" />
        <Skeleton width="100%" height={22} radius="sm" />
      </div>
    </div>
  );
}
