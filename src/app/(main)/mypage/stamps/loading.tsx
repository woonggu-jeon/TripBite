import { Skeleton } from '@/components/feedback/Skeleton';
import { SubHeaderSkeleton } from '@/components/feedback/SubHeaderSkeleton';

/**
 * /mypage/stamps cold start fallback — StampsClient isLoading 분기 정합.
 *   - wrap: padding 18 16 24 gap 18
 *   - progCard 68 + mapCard 360
 */
export default function StampsLoading() {
  return (
    <div
      style={{
        display: 'grid',
        gap: 18,
        padding: '18px 16px 24px',
      }}
    >
      <SubHeaderSkeleton wrapPadding={18} />
      <Skeleton width="100%" height={68} radius="md" />
      <Skeleton width="100%" height={360} radius="lg" />
    </div>
  );
}
