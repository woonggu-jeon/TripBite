import type { ReactNode } from 'react';
import styles from './PageSection.module.scss';

/**
 * 페이지 섹션 primitive — 타이틀 / 보조설명 / 우측 액션 / 본문 일관 처리.
 *
 *   <PageSection
 *     title="이번주 우승 Top 5"
 *     hint="투표 결과 기반"
 *     action={<Link href="/rankings">전체 →</Link>}
 *   >
 *     <RankingList ... />
 *   </PageSection>
 *
 * - title 만 있으면 H2 + 본문
 * - hint 는 title 아래 보조 텍스트
 * - action 은 우측 상단 정렬
 * - level 로 h2/h3 시멘틱 조정 (default h2)
 * - 본문 gap 은 children 책임 (PageSection 은 header 와 body 사이 간격만 보장)
 */
interface PageSectionProps {
  title?: string;
  hint?: string;
  action?: ReactNode;
  level?: 'h2' | 'h3';
  className?: string;
  children: ReactNode;
}

export function PageSection({
  title,
  hint,
  action,
  level = 'h2',
  className,
  children,
}: PageSectionProps) {
  const Heading = level;
  const hasHeader = !!title || !!action;
  return (
    <section className={[styles.section, className].filter(Boolean).join(' ')}>
      {hasHeader && (
        <header className={styles.header}>
          <div className={styles.titleBlock}>
            {title && <Heading className={styles.title}>{title}</Heading>}
            {hint && <p className={styles.hint}>{hint}</p>}
          </div>
          {action && <div className={styles.action}>{action}</div>}
        </header>
      )}
      <div className={styles.body}>{children}</div>
    </section>
  );
}
