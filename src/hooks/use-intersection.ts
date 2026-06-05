'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * IntersectionObserver 훅 — **callback ref 패턴**.
 *
 * 용도:
 *   - 무한스크롤 (리스트 끝 sentinel 감지)
 *   - lazy load (이미지/위젯이 뷰포트 근접 시 마운트)
 *   - "한 번 보였다가 가렸다 다시 보이면 갱신" 같은 가시성 트래킹
 *
 * 왜 callback ref?
 *   - useRef + useEffect 는 ref.current 변경을 감지 못 함 — sentinel 이 조건부로
 *     (예: `{hasNext && <sentinel />}`) 늦게 mount 되는 경우 observer 가 attach 안 됨.
 *     실제 회귀: InfiniteList 가 첫 fetch 후 hasNext=true 가 되어 sentinel 그릴 때
 *     observer 가 null 인 node 만 보고 끝나 무한스크롤 발동 X.
 *   - callback ref 는 React 가 node mount/unmount 시 자동 호출 → state 갱신 →
 *     useEffect 재실행 → observer 정상 attach.
 *
 * 성능:
 *   - 옵저버는 unmount 시 자동 disconnect
 *   - rootMargin 으로 뷰포트 도달 전에 미리 트리거 가능 (스크롤 끊김 방지)
 */
export function useIntersection<T extends Element>(
  options?: IntersectionObserverInit,
) {
  const [node, setNode] = useState<T | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      // SSR or 미지원 환경 — 즉시 보이는 것으로 간주.
      setIsIntersecting(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) setIsIntersecting(entry.isIntersecting);
      },
      {
        rootMargin: '200px',
        threshold: 0,
        ...options,
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [node, options]);

  const ref = useCallback((next: T | null) => setNode(next), []);

  return { ref, isIntersecting };
}
