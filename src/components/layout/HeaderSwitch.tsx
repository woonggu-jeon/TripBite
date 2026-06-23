'use client';

import { usePathname } from 'next/navigation';
import { AppHeader } from './AppHeader';

/**
 * AppHeader(알림/로고/설정) 를 보여줄 페이지 화이트리스트.
 *
 * 기준: BottomNav 진입점 중 "메인 / 홈 성격" 페이지만.
 *   - '/'        — 홈 (메인)
 *
 * 다른 BottomNav 진입점 (ranking/tournament/letter/mypage) 는 SubHeader 사용
 * (back + title + 선택적 rightSlot). Figma "Header type=my" 정합.
 * /mypage 는 2026-06-23 부터 SubHeader 적용 (settings 는 rightSlot icon).
 * client 컴포넌트로 분리해 (main)/layout.tsx 는 server 유지.
 */
const APP_HEADER_PATHS = new Set<string>(['/']);

export function HeaderSwitch() {
  const pathname = usePathname();
  if (!APP_HEADER_PATHS.has(pathname)) return null;
  return <AppHeader />;
}
