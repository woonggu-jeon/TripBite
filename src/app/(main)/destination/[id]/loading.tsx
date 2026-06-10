import { Skeleton } from '@/components/feedback/Skeleton';

/**
 * /destination/[id] streaming fallback — on-demand ISR generate 동안 paint.
 *
 * SubHeader 자리 + photos hero + name + detail panel 라인 placeholder.
 * 첫 진입 cold start 시 빈 화면 대신 즉시 skeleton.
 */
export default function DestinationDetailLoading() {
  return (
    <div
      style={{
        padding: 'var(--space-4)',
        display: 'grid',
        gap: 'var(--space-3)',
      }}
    >
      <Skeleton width="50%" height={28} radius="md" />
      <Skeleton width="100%" height={240} radius="lg" />
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
      >
        <Skeleton width={64} height={64} radius="full" />
        <Skeleton width="40%" height={14} radius="sm" />
      </div>
      <Skeleton width="70%" height={28} radius="md" />
      <Skeleton width="100%" height={120} radius="lg" />
      <Skeleton width="100%" height={80} radius="lg" />
    </div>
  );
}
