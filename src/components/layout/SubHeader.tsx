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
  onBack,
}: {
  title: string;
  rightSlot?: React.ReactNode;
  /**
   * 뒤로가기 동작 override. 미전달 시 기본 동작:
   * history > 1 → router.back, 아니면 홈(/)으로 replace.
   * wizard step state 등 페이지 내부 분기 가 필요할 때 전달.
   */
  onBack?: () => void;
}) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    // 직접 진입(history 1) 시 router.back 은 새 탭/외부에서 들어왔을 때 동작 안 함.
    // 안전하게 홈으로 fallback.
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <div className={styles.bar}>
      <button
        type="button"
        aria-label="뒤로가기"
        className={styles.back}
        onClick={handleBack}
      >
        <ChevronLeft size={22} />
      </button>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.rightSlot}>{rightSlot}</div>
    </div>
  );
}
