import type { ReactNode } from 'react';
import styles from './ButtonGrid.module.scss';

/**
 * 동일 너비 버튼 N개를 가로로 배치하는 wrapper.
 *
 * 사용처: tournament result actionsRow, travel type result actionsRow,
 * tournament play mapActions, letter sent actions, destination actions 등.
 * 모두 `grid-template-columns: repeat(N, 1fr); gap: 0.5rem` 동일 패턴.
 *
 * Children 은 보통 <Button fullWidth>. fullWidth 가 1fr 컬럼을 채우므로
 * 별도 정렬/너비 prop 불필요.
 *
 * gap='md' (0.75rem) 는 LetterSentClient / DestinationActions 처럼 텍스트
 * 위주 버튼이 옆에 붙어 보일 때 좀 더 여유. 기본 'sm' (0.5rem) 권장.
 */
export function ButtonGrid({
  children,
  columns = 2,
  gap = 'sm',
  className,
}: {
  children: ReactNode;
  columns?: 2 | 3;
  gap?: 'sm' | 'md';
  className?: string;
}) {
  return (
    <div
      className={[
        styles.grid,
        styles[`cols-${columns}`],
        styles[`gap-${gap}`],
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}
