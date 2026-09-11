import type { CSSProperties, ElementType, ReactNode } from 'react';
import styles from './Circle.module.scss';

/**
 * 연초록 원형 컨테이너 primitive — Figma `circle` (node 3378:133) 정합.
 *
 * 시안: 면 `MainColor/secondary01`(#EAF6EF), 내용물은 중앙 정렬 글리프.
 * 세트는 96 / 84 / 72 세 단계지만 화면마다 40 / 54 / 56 도 쓰고 있어
 * `size` 는 px 숫자로 받는다 (4px 그리드 정렬은 호출부 책임).
 *
 * 이 primitive 가 책임지는 것 — 모양·면·중앙 정렬·고정 크기:
 *   display:grid + place-items:center · border-radius:full ·
 *   background: --color-primary-soft · width/height = size · flex-shrink:0
 *
 * 책임지지 않는 것 (호출부 className 으로):
 *   - 내용물 색 (`color`) — 화면마다 다르다. AuthHero 는 대비 때문에
 *     --color-primary-text-bold, EmptyState 는 시안 그대로 --color-primary
 *     (docs/design/DESIGN.md §7-1 장식 예외).
 *   - 내용물 크기 (img 36 / Icon 20 / emoji font-size)
 *   - 상태 오버라이드 (SelectCard 의 `.selected .circle { background }`)
 *
 * 배경: 같은 블록이 4곳(EmptyState / AuthHero / SelectCard /
 * TournamentHistorySection)에 복붙돼 있었다 — docs/design/FIGMA_CROSSCHECK.md §1-C.
 * Top5Card 의 회색 썸네일과 LocationStep 의 96px 에셋은 다른 것이라 제외.
 */
export interface CircleProps {
  /** 지름(px). Figma circle 96/84/72, circleIcon 46/36. */
  size: number;
  /** 기본 span. EmptyState 처럼 블록 문맥이면 'div'. */
  as?: ElementType;
  className?: string;
  /** SelectCard 의 계절 파스텔(mediaTone)처럼 면색을 인라인으로 덮을 때. */
  style?: CSSProperties;
  'aria-hidden'?: boolean | 'true' | 'false';
  children?: ReactNode;
}

export function Circle({
  size,
  as: Tag = 'span',
  className,
  style,
  children,
  ...rest
}: CircleProps) {
  const cls = [styles.circle, className].filter(Boolean).join(' ');
  const inline = {
    '--circle-size': `${size}px`,
    ...style,
  } as CSSProperties;
  return (
    <Tag className={cls} style={inline} {...rest}>
      {children}
    </Tag>
  );
}
