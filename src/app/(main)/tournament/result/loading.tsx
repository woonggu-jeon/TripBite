import { Skeleton } from '@/components/feedback/Skeleton';
import { SubHeaderSkeleton } from '@/components/feedback/SubHeaderSkeleton';

/** /tournament/result — 우승지 hero + 통계 + actions. */
export default function TournamentResultLoading() {
  return (
    <div
      style={{
        padding: 'var(--space-4)',
        display: 'grid',
        gap: 'var(--space-4)',
      }}
    >
      <SubHeaderSkeleton wrapPadding={16} />
      {/* 우승지 hero (이미지 + 이름) */}
      <Skeleton width="100%" height={260} radius="lg" />
      <Skeleton width="60%" height={24} radius="md" />
      {/* description / detail */}
      <Skeleton width="100%" height={80} radius="md" />
      {/* actions (저장 / 공유 / 다시 시작) */}
      <div style={{ display: 'grid', gap: 8 }}>
        <Skeleton width="100%" height={48} radius="md" />
        <Skeleton width="100%" height={48} radius="md" />
      </div>
    </div>
  );
}
