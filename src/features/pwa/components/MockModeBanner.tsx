'use client';

import { Chip } from '@/components/ui';
import styles from './MockModeBanner.module.scss';

/**
 * 운영(prod) 에서 mock 데이터로 동작 중일 때 헤더 좌측 dev slot 에 표시.
 *
 *   - NEXT_PUBLIC_USE_MSW === 'true' 인 빌드에서만 렌더 (AppHeader 에서 조건부)
 *   - 사용자가 실데이터로 오해하지 않도록 작은 'DEMO' 라벨
 *
 * 디자인 입히기 가이드: Chip primitive 사용 — variant 만 바꾸면 톤 변경.
 */
export function MockModeBanner() {
  return (
    <div className={styles.wrap} role="status" aria-label="DEMO mode">
      <Chip variant="solid" size="sm">
        DEMO
      </Chip>
    </div>
  );
}
