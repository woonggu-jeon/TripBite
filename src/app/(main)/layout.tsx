import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { HeaderSwitch } from '@/components/layout/HeaderSwitch';
import { BottomNav } from '@/components/layout/BottomNav';
import { ProtectedScope } from './_components/ProtectedScope';
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
export default async function MainLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Skip-to-content link — 키보드 사용자가 헤더/네비 건너뛰고 본문으로 즉시.
  // 평소 시각적으로 숨겨져 있다가 focus 시 좌상단에 표시. visually-hidden + focus 표시.
  const t = await getTranslations('common');
  return (
    <div className={styles.shell}>
      <a href="#main-content" className={styles.skipLink}>
        {t('skipToContent')}
      </a>
      <HeaderSwitch />
      <main id="main-content" className={styles.content} tabIndex={-1}>
        <div className={styles.contentInner}>
          <ProtectedScope>{children}</ProtectedScope>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
