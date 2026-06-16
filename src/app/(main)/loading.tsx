import { Skeleton } from '@/components/feedback/Skeleton';

/**
 * (main) 그룹 공용 cold start fallback.
 *
 * Next.js 가 `(main)/*` 경로의 SSR 가 완료될 때까지 자동 표시.
 * 더 깊은 path 에 자체 `loading.tsx` 있으면 그쪽이 override (예: region/[code]).
 *
 * (main)/layout.tsx 의 HeaderSwitch + BottomNav 는 그대로 보임 — 본 fallback 은
 * content 영역만 채움. CLS 회피를 위해 일반적 page shape (헤더 + 위젯 3-4 줄)
 * 시뮬레이션.
 */
export default function MainLoading() {
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
      <Skeleton width="100%" height={120} radius="lg" />
      <Skeleton width="60%" height={20} radius="sm" />
      <Skeleton width="100%" height={96} radius="lg" />
    </div>
  );
}
