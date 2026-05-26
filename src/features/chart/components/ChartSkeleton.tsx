import { Skeleton } from '@/components/feedback/Skeleton';

/**
 * 차트 로딩 자리잡이
 * - 동적 import 동안 표시
 * - 레이아웃 시프트 방지를 위해 height는 호출부와 맞춰야 함
 */
export function ChartSkeleton({ height = 240 }: { height?: number }) {
  return (
    <div style={{ width: '100%', height, padding: '8px 0' }}>
      <Skeleton width="100%" height="100%" radius="md" />
    </div>
  );
}
