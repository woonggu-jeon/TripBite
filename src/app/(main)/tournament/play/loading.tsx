import { Skeleton } from '@/components/feedback/Skeleton';

/**
 * /tournament/play cold start fallback — 매치업 2 카드 (좌/우) + VS center.
 */
export default function TournamentPlayLoading() {
  return (
    <div
      style={{
        padding: 'var(--space-4)',
        display: 'grid',
        gap: 'var(--space-3)',
      }}
    >
      {/* round 표시 */}
      <Skeleton width="30%" height={20} radius="sm" />
      {/* 매치업 — 두 큰 카드 + 중앙 VS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: 8,
          alignItems: 'center',
        }}
      >
        <Skeleton width="100%" height={280} radius="lg" />
        <Skeleton width={36} height={36} radius="full" />
        <Skeleton width="100%" height={280} radius="lg" />
      </div>
    </div>
  );
}
