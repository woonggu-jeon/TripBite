import { Skeleton } from '@/components/feedback/Skeleton';

/**
 * /mypage cold start fallback — component skeleton 과 layout 일치:
 *   - ProfileCard (즉시 mount, 자체 skeleton 없음) — avatar 64 circle + 2 line text.
 *   - StampBookBanner placeholder — 120 block.
 *   - SavedTournamentsSection isLoading: 152×168 × 3 horizontal flex.
 *   - TournamentHistorySection isLoading: SkeletonList count 3 height 56.
 *
 * mount 후 component skeleton 과 시각 동일 → cold → mount → data 전환 시
 * skeleton 깜빡임 없음 (CLS 0).
 */
export default function MyPageLoading() {
  return (
    <div
      style={{
        padding: 'var(--space-4)',
        display: 'grid',
        gap: 'var(--space-4)',
      }}
    >
      {/* SubHeader placeholder — page.tsx 의 SubHeader 가 server 라 cold start
          fallback 시 미렌더. 56h white bar + border + 음의 margin 으로 wrap
          padding(--space-4) + contentInner padding(--content-pad) 양쪽 탈출. */}
      <div
        style={{
          height: 56,
          background: 'var(--color-bg)',
          borderBottom: '1px solid var(--color-border)',
          marginLeft: 'calc(-1 * var(--content-pad))',
          marginRight: 'calc(-1 * var(--content-pad))',
          marginTop: 'calc(-1 * (var(--space-4) + var(--content-pad)))',
          marginBottom: 'calc(-1 * var(--space-4))',
        }}
        aria-hidden
      />

      {/* ProfileCard avatar + nickname */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Skeleton width={64} height={64} radius="full" />
        <div style={{ flex: 1, display: 'grid', gap: 6 }}>
          <Skeleton width="40%" height={20} radius="sm" />
          <Skeleton width="60%" height={14} radius="sm" />
        </div>
      </div>
      {/* StampBookBanner */}
      <Skeleton width="100%" height={120} radius="lg" />
      {/* SavedTournamentsSection: title + 152×168 × 3 horizontal */}
      <Skeleton width="40%" height={20} radius="sm" />
      <div style={{ display: 'flex', gap: 8, overflow: 'hidden' }}>
        <Skeleton width={152} height={168} radius="lg" />
        <Skeleton width={152} height={168} radius="lg" />
        <Skeleton width={152} height={168} radius="lg" />
      </div>
      {/* TournamentHistorySection: title + 3 × 56 */}
      <Skeleton width="40%" height={20} radius="sm" />
      <Skeleton width="100%" height={56} radius="md" />
      <Skeleton width="100%" height={56} radius="md" />
      <Skeleton width="100%" height={56} radius="md" />
    </div>
  );
}
