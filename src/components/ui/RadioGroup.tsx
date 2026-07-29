'use client';

import { type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
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
/**
 * 화살표 키 네비게이션 — ARIA APG radiogroup 패턴.
 *   - ArrowLeft/Up   → 이전 옵션 focus + select
 *   - ArrowRight/Down → 다음 옵션 focus + select
 *   - Home/End        → 첫 / 마지막 옵션
 * disabled radio 는 skip. roving tabindex 미도입 (모든 옵션 Tab 진입 유지).
 */
function handleRadioGroupKeyDown(e: KeyboardEvent<HTMLDivElement>) {
  const key = e.key;
  if (
    key !== 'ArrowLeft' &&
    key !== 'ArrowRight' &&
    key !== 'ArrowUp' &&
    key !== 'ArrowDown' &&
    key !== 'Home' &&
    key !== 'End'
  )
    return;
  const options = Array.from(
    e.currentTarget.querySelectorAll<HTMLButtonElement>(
      'button[role="radio"]:not([disabled])',
    ),
  );
  if (options.length === 0) return;
  const activeEl = document.activeElement as HTMLButtonElement | null;
  const currentIndex = activeEl ? options.indexOf(activeEl) : -1;
  let nextIndex: number;
  if (key === 'Home') nextIndex = 0;
  else if (key === 'End') nextIndex = options.length - 1;
  else if (key === 'ArrowLeft' || key === 'ArrowUp')
    nextIndex = currentIndex <= 0 ? options.length - 1 : currentIndex - 1;
  else
    nextIndex =
      currentIndex < 0 || currentIndex === options.length - 1
        ? 0
        : currentIndex + 1;
  e.preventDefault();
  const target = options[nextIndex];
  if (target) {
    target.focus();
    target.click();
  }
}

export function RadioGroup({ label, className, children }: RadioGroupProps) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={className}
      onKeyDown={handleRadioGroupKeyDown}
      // jsx-a11y/interactive-supports-focus 충족용. ARIA APG 상 radiogroup
      // 자체는 focusable 필요 없지만 (자식 button 이 focus 받음), eslint
      // rule 보수. -1 로 Tab 키 진입 안 함 + 자식 button focus 그대로 유지.
      tabIndex={-1}
    >
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
  /**
   * 이미 선택된 옵션 재클릭 시에도 onSelect 호출 허용. 기본 false (idempotent).
   * 사용: TravelTypeQuiz — progress 점프 후 같은 답으로 다음 단계 진행하는
   * confirm 시나리오. 일반 라디오 (CategoryFilter / SeasonSelector 등) 는 그대로.
   */
  allowReselect?: boolean;
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
  allowReselect = false,
  disabled = false,
  children,
  'aria-label': ariaLabel,
}: RadioOptionProps) {
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    // 이미 선택된 옵션 재클릭은 기본 idempotent (Tab 동작과 동일). allowReselect
    // opt-in 시엔 onSelect 다시 호출 — quiz progress 점프 후 confirm 등.
    if (checked && !allowReselect) return;
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
