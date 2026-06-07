'use client';

import { type ReactNode, type MouseEvent } from 'react';
import { haptic } from '@/lib/haptic';

export interface RadioGroupProps {
  /** 그룹 aria-label — 스크린리더에 어떤 그룹인지 알림. */
  label: string;
  /** container className (layout — list/grid 등). */
  className?: string;
  children: ReactNode;
}

/**
 * `role="radiogroup"` wrapper.
 *
 * 6 사용처 (CategoryFilter / ThemeKindSelector / SeasonSelector / CountSelector /
 * ThemeSection / TravelTypeQuiz) 가 동일한 wrapper 패턴 반복했던 것을 흡수.
 * 각 옵션은 [[RadioOption]] 으로 감싼다.
 */
export function RadioGroup({ label, className, children }: RadioGroupProps) {
  return (
    <div role="radiogroup" aria-label={label} className={className}>
      {children}
    </div>
  );
}

export interface RadioOptionProps {
  /** 선택 상태. */
  checked: boolean;
  /** 선택 콜백 — haptic.tap() 은 본 primitive 가 호출. */
  onSelect: () => void;
  /** button className — active 변형은 호출 측이 active class 를 함께 전달. */
  className?: string;
  /**
   * iOS Safari/PWA 안전망 — 클릭 후 `e.currentTarget.blur()`.
   * 토너먼트 Matchup 처럼 다음 매치에서 같은 DOM 이 재사용되며 focus 강조가
   * 남는 케이스에 사용. 기본 false.
   */
  blurOnClick?: boolean;
  disabled?: boolean;
  children: ReactNode;
  /** 옵션 자체 aria-label (label 텍스트가 visible 이 아닐 때만). */
  'aria-label'?: string;
}

/**
 * `role="radio"` 버튼 — `role="radiogroup"` 안에서 사용.
 *
 * a11y(role/aria-checked) + haptic + blur 안전망을 흡수. content 는 children.
 * 카드형/list/segmented 등 layout 자유 — className 으로 결정.
 */
export function RadioOption({
  checked,
  onSelect,
  className,
  blurOnClick,
  disabled = false,
  children,
  'aria-label': ariaLabel,
}: RadioOptionProps) {
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    haptic.tap();
    if (blurOnClick) e.currentTarget.blur();
    onSelect();
  };
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      className={className}
      onClick={handleClick}
    >
      {children}
    </button>
  );
}
