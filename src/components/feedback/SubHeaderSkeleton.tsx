import type { CSSProperties } from 'react';

/**
 * SubHeader 자리 placeholder — loading.tsx fallback 안에서 사용.
 *
 * 배경: page.tsx 가 server component 라 `<SubHeader>` 를 server render. 그러나
 * client component 의 Suspense fallback (loading.tsx) 표시 동안에는 page.tsx
 * 전체가 fallback 으로 대체됨 — SubHeader 도 미렌더 → cold start (skeleton
 * 만 표시) → mount (SubHeader 56h 갑자기 추가) 큰 layout jump.
 *
 * 사용:
 *   <div style={{ padding: 0 또는 16 등 wrap padding }}>
 *     <SubHeaderSkeleton wrapPadding={16} />  ← wrap padding 음의 margin 으로 탈출
 *     ...
 *   </div>
 *
 * wrapPadding=0 (default) 이면 contentInner padding(--content-pad) 만 탈출.
 * wrap padding 이 있으면 그만큼 추가 음의 margin-top 으로 탈출 + margin-bottom
 * 으로 자식 위치 자연 복귀.
 *
 * SubHeader.module.scss 의 56h white + 1px gray border 와 시각 동일.
 */
export function SubHeaderSkeleton({
  wrapPadding = 0,
}: {
  /** loading.tsx wrap 의 padding-y. 보통 0 또는 16 (var(--space-4)). */
  wrapPadding?: number;
}) {
  const marginTop = wrapPadding
    ? `calc(-1 * var(--content-pad) - ${wrapPadding}px)`
    : `calc(-1 * var(--content-pad))`;
  const marginBottom = wrapPadding ? `${-wrapPadding}px` : undefined;
  const style: CSSProperties = {
    height: 56,
    background: 'var(--color-bg)',
    borderBottom: '1px solid var(--color-border)',
    marginLeft: 'calc(-1 * var(--content-pad))',
    marginRight: 'calc(-1 * var(--content-pad))',
    marginTop,
    marginBottom,
  };
  return <div style={style} aria-hidden />;
}
