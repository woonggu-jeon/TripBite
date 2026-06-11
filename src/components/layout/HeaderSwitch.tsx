'use client';

import { usePathname } from 'next/navigation';
import { AppHeader } from './AppHeader';

/**
 * AppHeader(알림/로고/설정) 를 보여줄 페이지 화이트리스트.
 *
 * 기준: BottomNav 진입점 중 self-contained / 뒤로갈 곳 없는 페이지.
 *   - '/'        — 홈 (메인)
 *   - '/mypage'  — 마이페이지 (프로필 / 설정 진입점)
 *
 * 그 외 페이지 (랭킹/토너먼트/편지/시군상세 등) 는 각자 SubHeader 사용.
 * client 컴포넌트로 분리해 (main)/layout.tsx 는 server 유지.
 */
const APP_HEADER_PATHS = new Set<string>(['/', '/mypage']);

export function HeaderSwitch() {
  const pathname = usePathname();
  if (!APP_HEADER_PATHS.has(pathname)) return null;
  return <AppHeader />;
}
