'use client';

import type { ReactNode } from 'react';
import { RadioOption } from '@/components/ui';
import styles from './SelectCard.module.scss';

export type SelectCardLayout = 'row' | 'column';

export interface SelectCardProps {
  /**
   * Figma 카드 두 종류.
   *   row    — `big-card` 320x94. 원형 아이콘 + 텍스트 가로 배치 (테마·카테고리)
   *   column — `season-card` 154x145 / `big-card` 154x92. 세로 중앙 정렬
   *            (계절은 원형 아이콘 있음, 갯수/규모는 없음)
   */
  layout?: SelectCardLayout;
  selected: boolean;
  onSelect: () => void;
  /** 원형 배지 안에 들어가는 그림 (Figma 36px seasonIcon / themeIcon / cateIcon). */
  media?: ReactNode;
  /**
   * 원형 배지 면색 강제. 계절 카드는 선택 여부와 무관하게 계절별 파스텔을 쓴다
   * (봄 #FFEBEB, 여름 #E0FF89, 가을 #FFCD99, 겨울 #E8F1FD).
   * 미지정이면 선택 시 흰색 / 미선택 시 연초록 — Figma 테마·카테고리 카드 규칙.
   */
  mediaTone?: string;
  /** Basic Body/B_14_140%. 갯수·규모 카드는 숫자+단위 조합이라 ReactNode 허용. */
  title: ReactNode;
  /** Caption/R_12. */
  desc?: ReactNode;
  /** 카드 전체를 대표하는 a11y 라벨 (title 이 ReactNode 일 때 필요). */
  ariaLabel?: string;
}

/**
 * 토너먼트 설정 흐름의 선택 카드 — Figma `big-card` / `season-card`.
 *
 * 4개 화면(테마·계절·카테고리·갯수/규모)이 같은 카드를 쓰는데 구현은 화면마다
 * 제각각이었다(이모지 + 체크표시 + 계절 그라데이션 등). 이 컴포넌트로 통일.
 *
 * 공통 규격: radius 12, 1px `#E0E0E0`.
 * 선택 상태: 면 `#EAF6EF` + 테두리 `#00B334` + 제목·설명 초록.
 */
export function SelectCard({
  layout = 'row',
  selected,
  onSelect,
  media,
  mediaTone,
  title,
  desc,
  ariaLabel,
}: SelectCardProps) {
  return (
    <RadioOption
      checked={selected}
      onSelect={onSelect}
      aria-label={ariaLabel}
      className={[
        styles.card,
        layout === 'row' ? styles.row : styles.column,
        selected ? styles.selected : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {media && (
        <span
          className={styles.circle}
          style={mediaTone ? { background: mediaTone } : undefined}
          aria-hidden
        >
          {media}
        </span>
      )}
      <span className={styles.text}>
        <span className={styles.title}>{title}</span>
        {desc && <span className={styles.desc}>{desc}</span>}
      </span>
    </RadioOption>
  );
}
