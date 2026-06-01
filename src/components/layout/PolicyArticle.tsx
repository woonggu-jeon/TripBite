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
      <p className={styles.body}>{children}</p>
    </section>
  );
}

export function PolicyFooter({ children }: { children: ReactNode }) {
  return <p className={styles.footer}>{children}</p>;
}
