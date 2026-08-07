'use client';

import { useRouter } from 'next/navigation';
import { Icon } from '@/components/icon';
import styles from './AuthHeader.module.scss';

/**
 * auth 화면 헤더 — Figma auth 섹션의 `header` 인스턴스 (360x56, padding 0 20).
 *
 * 시안 관찰:
 *   - 회원가입      : 뒤로 + 중앙 제목 "회원가입" + 하단선
 *   - 아이디/비번찾기 : 뒤로만, 제목·하단선 없음
 *   → 제목이 있을 때만 하단선을 그린다.
 *
 * (main) 의 SubHeader 를 쓰지 않는 이유: SubHeader 는 `.contentInner` 기준
 * 100vw 확장 + 음수 마진에 의존해 auth 레이아웃에서 어긋난다.
 */
export function AuthHeader({
  title,
  onBack,
}: {
  title?: string;
  /** 뒤로가기 override. 미전달 시 history > 1 → back, 아니면 /login 으로. */
  onBack?: () => void;
}) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.replace('/login');
    }
  };

  return (
    <header className={`${styles.bar} ${title ? styles.bordered : ''}`}>
      {/* inner — 컨텐츠와 동일하게 720px 정렬 (AppHeader/SubHeader 와 동일) */}
      <div className={styles.inner}>
        <button
          type="button"
          aria-label="뒤로가기"
          className={styles.back}
          onClick={handleBack}
        >
          <Icon name="back" size={24} />
        </button>
        {title && <p className={styles.title}>{title}</p>}
        <span className={styles.spacer} aria-hidden />
      </div>
    </header>
  );
}
