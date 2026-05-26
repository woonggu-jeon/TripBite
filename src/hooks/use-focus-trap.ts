'use client';

import { useEffect } from 'react';

/**
 * 포커스 트랩 — 모달/다이얼로그 안에 포커스 가두기
 *
 * 접근성 + 보안 (피싱 방지) 양쪽에 기여.
 *
 * 사용:
 *   const ref = useRef<HTMLDivElement>(null);
 *   useFocusTrap(ref, isOpen);
 *
 * 동작:
 *   - 모달 open 시 첫 focusable 로 이동
 *   - Tab/Shift+Tab 이 모달 밖으로 나가지 않게 wrap
 *   - close 시 이전 포커스로 복원
 */
const FOCUSABLE =
  'a[href], area[href], input:not([disabled]), select:not([disabled]), ' +
  'textarea:not([disabled]), button:not([disabled]), iframe, object, embed, ' +
  '[contenteditable], [tabindex]:not([tabindex^="-"])';

export function useFocusTrap(
  ref: React.RefObject<HTMLElement | null>,
  active: boolean,
) {
  useEffect(() => {
    if (!active || !ref.current) return;

    const container = ref.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusables = container.querySelectorAll<HTMLElement>(FOCUSABLE);
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    // 모달 진입 시 첫 focusable 으로 이동
    first?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }

    container.addEventListener('keydown', onKeyDown);
    return () => {
      container.removeEventListener('keydown', onKeyDown);
      // close 시 이전 포커스로 복원
      previouslyFocused?.focus?.();
    };
  }, [active, ref]);
}
