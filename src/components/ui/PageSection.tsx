import type { HTMLAttributes, ReactNode } from 'react';
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
 * - action 은 우측 상단 정렬 (Figma "더보기 >")
 * - level 로 h2/h3 시멘틱 조정 (default h2)
 * - variant="card" 는 Figma `rv-card` — 본문 전체를 카드 하나로 묶는다
 * - 본문 gap 은 children 책임 (PageSection 은 header 와 body 사이 간격만 보장.
 *   단 variant="card" 는 body 가 grid 라 gap 을 직접 준다)
 */
interface PageSectionProps extends HTMLAttributes<HTMLElement> {
  title?: string;
  hint?: string;
  action?: ReactNode;
  level?: 'h2' | 'h3';
  /**
   * `card` — Figma `rv-card`. 목록 전체를 흰 카드 하나(radius 12, 1px 보더,
   * padding 20/16)로 묶는다. 항목마다 개별 카드를 쓰던 화면을 시안에 맞출 때.
   */
  variant?: 'plain' | 'card';
  /**
   * 제목 크기. Figma 는 두 단계를 쓴다.
   *   `section` — Basic Body/B_16_140% (홈 "이런 여행 어때요?", 랭킹 rv-card)
   *   `group`   — Basic Body/SB_14_140% (설정의 "알림" / "계정" 처럼
   *               풀블리드 행 묶음 위에 붙는 작은 라벨)
   */
  titleScale?: 'section' | 'group';
  className?: string;
  children: ReactNode;
}

export function PageSection({
  title,
  hint,
  action,
  level = 'h2',
  variant = 'plain',
  titleScale = 'section',
  className,
  children,
  // data-* 등 나머지 속성은 section 요소로 그대로 전달 (홈 위젯의
  // data-widget / data-type 처럼 CSS 훅으로 쓰이는 것들).
  ...rest
}: PageSectionProps) {
  const Heading = level;
  const hasHeader = !!title || !!action;
  return (
    <section
      className={[
        styles.section,
        variant === 'card' ? styles.card : '',
        titleScale === 'group' ? styles.sectionGroup : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {hasHeader && (
        <header className={styles.header}>
          <div className={styles.titleBlock}>
            {title && (
              <Heading
                className={
                  titleScale === 'group'
                    ? `${styles.title} ${styles.titleGroup}`
                    : styles.title
                }
              >
                {title}
              </Heading>
            )}
            {hint && <p className={styles.hint}>{hint}</p>}
          </div>
          {action && <div className={styles.action}>{action}</div>}
        </header>
      )}
      <div className={styles.body}>{children}</div>
    </section>
  );
}
