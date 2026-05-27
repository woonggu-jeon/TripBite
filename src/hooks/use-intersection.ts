'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * IntersectionObserver 훅
 *
 * 용도:
 *   - 무한스크롤 (리스트 끝 sentinel 감지)
 *   - lazy load (이미지/위젯이 뷰포트 근접 시 마운트)
 *   - "한 번 보였다가 가렸다 다시 보이면 갱신" 같은 가시성 트래킹
 *
 * 성능:
 *   - 옵저버는 unmount 시 자동 disconnect
 *   - rootMargin 으로 뷰포트 도달 전에 미리 트리거 가능 (스크롤 끊김 방지)
 */
export function useIntersection<T extends Element>(
  options?: IntersectionObserverInit,
) {
  const ref = useRef<T | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      // SSR or 미지원 환경
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
  }, [options]);

  return { ref, isIntersecting };
}
