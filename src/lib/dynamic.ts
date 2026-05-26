import dynamic, { type DynamicOptions } from 'next/dynamic';
import type { ComponentType } from 'react';

/**
 * 동적 import 공통 헬퍼
 *
 * 왜 만들었나:
 *   - 차트, 캐러셀, 지도 등 무거운 모듈은 main bundle에서 분리해야
 *     초기 페이지 로드가 빨라짐.
 *   - 표준 옵션을 한 곳에 모아두면 일관성 유지.
 *
 * 두 가지 변형:
 *   1) clientOnly: SSR 비활성화 (Geolocation/IntersectionObserver/Web API 의존)
 *   2) ssrLazy:    SSR은 살리되 hydration만 늦춤 (SEO 영향 X인 컴포넌트)
 *
 * 사용:
 *   const Chart = clientOnly(() => import('./Chart'), { loading: () => <ChartSkeleton /> });
 *
 * Note:
 *   Server Component에서는 dynamic을 직접 호출할 수 없음.
 *   동적 로드가 필요한 컴포넌트는 'use client' 파일에서 wrap.
 */

type Loader<P> = () => Promise<ComponentType<P> | { default: ComponentType<P> }>;

export function clientOnly<P>(
  loader: Loader<P>,
  options?: Omit<DynamicOptions<P>, 'ssr'>,
) {
  return dynamic(loader, { ...options, ssr: false });
}

export function ssrLazy<P>(
  loader: Loader<P>,
  options?: Omit<DynamicOptions<P>, 'ssr'>,
) {
  return dynamic(loader, { ...options, ssr: true });
}
