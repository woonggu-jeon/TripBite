'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import styles from './SubHeader.module.scss';

/**
 * 서브 페이지용 헤더
 *
 * 사용처:
 *   - 여행지 랭킹
 *   - 토너먼트
 *   - 다섯글자 편지
 *   - 그 외 "뒤로가기 + 타이틀" 형태가 필요한 모든 페이지
 *
 * (main) layout의 AppHeader 바로 아래 영역에 페이지별로 추가 렌더링.
 *
 * 사양 (메뉴 요구사항):
 *   - 뒤로가기: 바로 전 페이지로 이동 (router.back)
 *   - 타이틀: prop으로 전달
 */
export function SubHeader({
  title,
  rightSlot,
}: {
  title: string;
  rightSlot?: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <div className={styles.bar}>
      <button
        type="button"
        aria-label="뒤로가기"
        className={styles.back}
        onClick={() => router.back()}
      >
        <ChevronLeft size={22} />
      </button>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.rightSlot}>{rightSlot}</div>
    </div>
  );
}
