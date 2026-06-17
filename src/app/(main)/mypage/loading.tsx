import { Skeleton } from '@/components/feedback/Skeleton';

/**
 * /mypage cold start fallback — ProfileCard + StampBookBanner +
 * SavedTournamentsSection + TournamentHistorySection 의 대략 layout 매칭.
 * BE 응답 도착 시점에 layout shift 최소화.
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
      {/* ProfileCard — avatar(circle) + nickname */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Skeleton width={64} height={64} radius="full" />
        <div style={{ flex: 1, display: 'grid', gap: 6 }}>
          <Skeleton width="40%" height={20} radius="sm" />
          <Skeleton width="60%" height={14} radius="sm" />
        </div>
      </div>
      {/* StampBookBanner */}
      <Skeleton width="100%" height={120} radius="lg" />
      {/* SavedTournamentsSection (가로 슬라이드) */}
      <Skeleton width="40%" height={20} radius="sm" />
      <Skeleton width="100%" height={160} radius="lg" />
      {/* TournamentHistorySection */}
      <Skeleton width="40%" height={20} radius="sm" />
      <Skeleton width="100%" height={80} radius="md" />
      <Skeleton width="100%" height={80} radius="md" />
    </div>
  );
}
