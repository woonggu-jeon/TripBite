'use client';

import { usePathname } from 'next/navigation';
import { AppHeader } from './AppHeader';

/**
 * 홈(/) 에서만 AppHeader(알림/로고/설정) 렌더링.
 * 그 외 페이지는 각자 SubHeader(← + 타이틀) 를 사용.
 *
 * client 컴포넌트로 분리해 (main)/layout.tsx 는 server 유지.
 */
export function HeaderSwitch() {
  const pathname = usePathname();
  if (pathname !== '/') return null;
  return <AppHeader />;
}
