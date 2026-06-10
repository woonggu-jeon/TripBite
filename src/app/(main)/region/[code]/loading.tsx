import { Skeleton } from '@/components/feedback/Skeleton';

/**
 * /region/[code] streaming fallback — ISR generate / cache miss 시 paint.
 *
 * SubHeader 자리 + RegionHero (140px) + 탭 라인 + content row 3개 placeholder.
 * 클라이언트 진입 시 즉시 보이므로 cold start 시간 동안 사용자 체감 ↓.
 */
export default function RegionDetailLoading() {
  return (
    <div
      style={{
        padding: 'var(--space-4)',
        display: 'grid',
        gap: 'var(--space-3)',
      }}
    >
      <Skeleton width="50%" height={28} radius="md" />
      <Skeleton width="100%" height={140} radius="lg" />
      <Skeleton width="60%" height={32} radius="md" />
      <Skeleton width="100%" height={96} radius="lg" />
      <Skeleton width="100%" height={96} radius="lg" />
      <Skeleton width="100%" height={96} radius="lg" />
    </div>
  );
}
