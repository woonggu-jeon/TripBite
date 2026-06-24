import { Skeleton } from '@/components/feedback/Skeleton';
import { SkeletonList } from '@/components/feedback/SkeletonList';
import { SubHeaderSkeleton } from '@/components/feedback/SubHeaderSkeleton';

/**
 * /ranking cold start fallback — Figma "RNK · 랭킹" layout 과 동일 placeholder.
 *
 * RankingPageContent isLoading 분기와 같은 markup → loading → mount → data
 * 전환 시 skeleton 가 같은 모양 유지하여 "2번 깜빡임" 회피 (CLS 0).
 *
 * 구조:
 *   - body padding 4 16 0 (contentInner 16 padding 와 합쳐 16+ 정합).
 *   - WeekLabel placeholder (inline R_12 muted 1줄).
 *   - rv-card 1: title + hero 152 + 4 row 64.
 *   - rv-card 2: title + 11 gun-row 32 (RegionWinsChart 자체 fallback 정합).
 */
export default function RankingLoading() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        paddingTop: 2,
      }}
    >
      <SubHeaderSkeleton wrapPadding={2} />

      {/* WeekLabel inline */}
      <Skeleton width="60%" height={17} radius="sm" />

      {/* rv-card 1 — 이번 주 인기 여행지 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: 20,
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 12,
          gap: 8,
        }}
      >
        {/* rv-title */}
        <Skeleton width="40%" height={22} radius="sm" />
        {/* spacer 8px = title margin-bottom 16 (component 정합) */}
        <div style={{ height: 8 }} />
        {/* Top1Hero — aspect-ratio 288/152 (component 와 동일 grow). */}
        <Skeleton
          width="100%"
          radius="md"
          style={{ aspectRatio: '288 / 152' }}
        />
        {/* 4 top5-row × 64 */}
        <SkeletonList count={4} height={64} radius="md" />
      </div>

      {/* rv-card 2 — 시군별 우승 횟수 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: 20,
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 12,
          gap: 8,
        }}
      >
        <Skeleton width="40%" height={22} radius="sm" />
        <div style={{ height: 8 }} />
        {/* RegionWinsChart fallback — 11 시군 row × 44h (component isLoading
            과 동일). 직전 5×32 placeholder 는 mount 후 jump 큼 — 2026-06-24. */}
        <SkeletonList count={11} height={44} radius="md" />
      </div>
    </div>
  );
}
