import { Skeleton } from '@/components/feedback/Skeleton';
import { SubHeaderSkeleton } from '@/components/feedback/SubHeaderSkeleton';

/**
 * /quiz cold start fallback — TravelTypeQuiz isLoading 분기 정합.
 *   - fallback class: gap 0.5rem padding 3rem 1rem center
 *   - 180 lg + 56 md + 56 md (TravelTypeQuiz 의 isLoading 첫 화면)
 */
export default function QuizLoading() {
  return (
    <div
      style={{
        display: 'grid',
        gap: '0.5rem',
        placeItems: 'center',
        padding: '3rem 1rem',
      }}
    >
      <SubHeaderSkeleton wrapPadding={48} />
      <Skeleton width="100%" height={180} radius="lg" />
      <Skeleton width="100%" height={56} radius="md" />
      <Skeleton width="100%" height={56} radius="md" />
    </div>
  );
}
