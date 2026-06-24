import { Skeleton } from '@/components/feedback/Skeleton';
import { SubHeaderSkeleton } from '@/components/feedback/SubHeaderSkeleton';

/**
 * /letter/sent cold start fallback — LetterSentClient isLoading 분기 정합.
 * /sent 는 "보낸 편지 단일 결과 카드" — 64 notice + 320 letter + 56 actions
 * (3 block). 이전 84×5 list fallback 회귀 정정.
 */
export default function LetterSentLoading() {
  return (
    <div
      style={{
        padding: 'var(--space-4)',
        display: 'grid',
        gap: 'var(--space-3)',
      }}
    >
      <SubHeaderSkeleton wrapPadding={16} />
      <Skeleton width="100%" height={64} radius="lg" />
      <Skeleton width="100%" height={320} radius="lg" />
      <Skeleton width="100%" height={56} radius="md" />
    </div>
  );
}
