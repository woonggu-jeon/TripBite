import type { ReactNode } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import styles from './layout.module.scss';

/**
 * (main) 라우트 그룹 공용 레이아웃
 *
 * ┌────────────────────────────┐
 * │ Header   (sticky top)      │ ← Client Component (알림/로고/설정)
 * ├────────────────────────────┤
 * │                            │
 * │ Content  (children)        │ ← 각 페이지 — 가능한 Server Component
 * │                            │
 * ├────────────────────────────┤
 * │ Nav      (fixed bottom)    │ ← Client Component (5 탭, active 처리)
 * └────────────────────────────┘
 *
 * 렌더링 성능 원칙 (이 레이아웃의 책임):
 *   1) 이 컴포넌트는 Server Component → HTML이 즉시 직렬화됨
 *   2) AppHeader/BottomNav 만 클라이언트 (각각 작은 인터랙션 단위)
 *   3) children 은 페이지가 Server Component로 와도, Client 로 와도 OK
 *   4) 헤더/네비는 sticky/fixed라 페이지 전환 시 재마운트 안 됨
 *      → 페이지 콘텐츠만 streaming/transition
 *
 * 페이지 작성 시 권장:
 *   - 페이지 page.tsx 는 Server Component (async)
 *   - 인터랙션이 있는 부분만 _components/*Client.tsx 로 분리
 *   - 무거운 위젯(차트, 캐롤셀, 지도)은 @/features/*에서 동적 import
 */
export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <AppHeader />
      <main className={styles.content}>{children}</main>
      <BottomNav />
    </div>
  );
}
