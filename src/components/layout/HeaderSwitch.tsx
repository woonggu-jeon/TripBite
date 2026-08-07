'use client';

import { usePathname } from 'next/navigation';
import { AppHeader } from './AppHeader';

/**
 * AppHeader(알림/로고/설정) 를 보여줄 페이지 화이트리스트.
 *
 * 기준: Figma 에서 로고 헤더를 쓰는 화면 — 홈뿐이다.
 *   - '/' — 홈 (`HOME · 홈` 의 종 · 로고 · 톱니 헤더)
 *
 * 마이페이지는 시안이 SubHeader 형태(뒤로 · "마이페이지" · 톱니)라 화이트리스트
 * 에서 제외했다. 두 헤더가 겹쳐 보이던 원인.
 * 그 외 페이지 (랭킹/토너먼트/편지/시군상세 등) 도 각자 SubHeader 사용.
 * client 컴포넌트로 분리해 (main)/layout.tsx 는 server 유지.
 */
const APP_HEADER_PATHS = new Set<string>(['/']);

export function HeaderSwitch() {
  const pathname = usePathname();
  if (!APP_HEADER_PATHS.has(pathname)) return null;
  return <AppHeader />;
}
