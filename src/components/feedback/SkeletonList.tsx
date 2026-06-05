import { Skeleton } from './Skeleton';

/**
 * 같은 모양의 Skeleton 을 N개 반복 — 리스트/그리드/카드 로딩 자리잡이 표준화.
 *
 * 사용처: SavedTournamentsAll(2x3), InfiniteList, NotificationsClient,
 *   OnboardingFlow, LetterSentClient, RankingPageContent 등 — 모두 동일
 *   `Array.from({length}).map((_, i) => <Skeleton key={i} ... />)` 패턴.
 *
 * 부모가 grid/flex 컨테이너이고 자식 폭만 100% 로 늘리는 케이스를 가정 — 그리드
 * 자체는 추상화 X. width 기본 '100%' 만 부여.
 *
 * className 은 개별 Skeleton 에 그대로 전달. wrapper element 는 추가하지 않음
 * (Fragment 반환) — 호출부의 grid/flex layout 에 자식이 직접 노출되도록.
 */
export function SkeletonList({
  count,
  height,
  width = '100%',
  radius = 'md',
  className,
}: {
  count: number;
  height: number | string;
  width?: number | string;
  radius?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          width={width}
          height={height}
          radius={radius}
          className={className}
        />
      ))}
    </>
  );
}
