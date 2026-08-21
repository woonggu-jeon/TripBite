import type { ReactNode } from 'react';
import styles from './AuthHero.module.scss';

/**
 * auth 화면 상단 안내 블록 — Figma `authItme` (312x177).
 *
 *   V gap 10
 *   ├ circle 84x84  (#EAF6EF 원 + 36px 아이콘)
 *   └ V gap 12 : 제목 Title/B_24_130% #151515
 *                설명 Basic Body/R_14_140% #393939 (2줄)
 *
 * `emptyItme`(EmptyState) 와 원 크기는 같지만 글자 크기·간격이 달라 별 컴포넌트다
 * (authItme = 24/14 + gap 10·12, emptyItme = 16·14/12 + gap 16·20).
 *
 * 사용처: 아이디 찾기(FindIdForm) · 비밀번호 찾기(ForgotPasswordForm).
 * BE 계정찾기 엔드포인트 추가(2026-08)로 두 폼 활성화 — 실사용 중.
 */
export function AuthHero({
  icon,
  title,
  description,
}: {
  /** 36px 라인 아이콘 (Figma circleIcon) */
  icon: ReactNode;
  title: string;
  /** `\n` 으로 줄바꿈 — 시안이 2줄이라 pre-line 으로 렌더한다. */
  description?: string;
}) {
  return (
    <div className={styles.hero}>
      <span className={styles.circle} aria-hidden>
        {icon}
      </span>
      <div className={styles.text}>
        <h1 className={styles.title}>{title}</h1>
        {description && <p className={styles.description}>{description}</p>}
      </div>
    </div>
  );
}
