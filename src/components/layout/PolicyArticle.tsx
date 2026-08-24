import type { ReactNode } from 'react';
import styles from './PolicyArticle.module.scss';

/**
 * Policy 페이지 (terms / privacy / licenses) 공통 article 컴포넌트.
 *
 * 사용:
 *   <PolicyArticle>
 *     <PolicySection heading="제1조 (목적)">...</PolicySection>
 *     <PolicyFooter>시행일자 ...</PolicyFooter>
 *   </PolicyArticle>
 *
 * Server Component — interactivity 없음. SSG 가능.
 */
export function PolicyArticle({ children }: { children: ReactNode }) {
  return <article className={styles.article}>{children}</article>;
}

export function PolicySection({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>{heading}</h2>
      {/* div 래퍼 — children 이 텍스트뿐 아니라 <ul> 등 블록 요소일 수 있어
          <p> 로 감싸면 `<p><ul>` 무효 중첩 → hydration 에러 (privacy 페이지). */}
      <div className={styles.body}>{children}</div>
    </section>
  );
}

export function PolicyFooter({ children }: { children: ReactNode }) {
  return <p className={styles.footer}>{children}</p>;
}
