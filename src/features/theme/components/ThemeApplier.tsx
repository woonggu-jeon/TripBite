'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/stores/ui-store';

/**
 * <ThemeApplier />
 *
 * 사용자가 ui-store 에 저장한 명시 theme 을 <html data-theme> 으로 반영.
 *
 * 값:
 *   - 'system' : data-theme 속성 제거 → CSS 의 @media (prefers-color-scheme) 만 동작.
 *   - 'light'  : data-theme="light" → :not([data-theme='light']) 매체 쿼리가 빠져 light 강제.
 *   - 'dark'   : data-theme="dark" → :root[data-theme='dark'] 가 dark 토큰 강제.
 *
 * SSR / hydration 안전:
 *   - 첫 렌더 시 'system' 으로 시작 → useEffect 가 클라 mount 후 localStorage 값으로 동기화.
 *   - hydration mismatch 회피 위해 data-theme 속성을 SSR 시점엔 비워두고 mount 후 적용.
 *
 * 렌더 X — 부수효과만.
 */
export function ThemeApplier() {
  const theme = useUIStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', theme);
    }
  }, [theme]);

  return null;
}
