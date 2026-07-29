'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * 스크롤 위치 보존 + 복원
 *
 * 시나리오: 편지함 무한스크롤로 50개 본 상태 → 편지 상세 진입 → 뒤로가기
 *   기본 동작: 맨 위로 점프 ✗
 *   원하는 동작: 보던 위치 그대로 ✓
 *
 * 동작:
 *   - 경로 떠날 때 sessionStorage 에 scrollY 저장
 *   - 같은 경로 재진입 시 복원
 *   - 다른 경로로 신규 진입 시 0
 *
 * Next.js App Router 의 scrollRestoration 은 history.back 만 지원.
 * 이 훅은 그 한계를 보완 (다양한 진입 시점 커버).
 *
 * 사용:
 *   // InfiniteList를 쓰는 페이지에서 한 번 호출
 *   useScrollRestoration();
 */
const KEY_PREFIX = '__scroll__';

export function useScrollRestoration() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const key = KEY_PREFIX + pathname;
    const saved = sessionStorage.getItem(key);
    if (saved) {
      const y = parseInt(saved, 10);
      // 다음 paint 까지 기다림 — 컨텐츠 마운트 후 스크롤
      requestAnimationFrame(() => window.scrollTo(0, y));
    }

    function onBeforeUnload() {
      sessionStorage.setItem(key, String(window.scrollY));
    }

    // 페이지 떠날 때 (라우트 전환 / 새로고침 / 종료)
    window.addEventListener('pagehide', onBeforeUnload);
    return () => {
      // 라우트 변경 시점 cleanup 에서도 저장
      sessionStorage.setItem(key, String(window.scrollY));
      window.removeEventListener('pagehide', onBeforeUnload);
    };
  }, [pathname]);
}
