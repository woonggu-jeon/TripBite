'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageView } from '@/features/analytics';

/** Providers 안에 마운트 — 라우트 변경 시마다 page.viewed 자동 전송 */
export function usePageView() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname) trackPageView(pathname);
  }, [pathname]);
}
