'use client';

import { useEffect } from 'react';

/**
 * 키보드 단축키 훅
 *
 * 사용:
 *   useKeyboard('Escape', () => setOpen(false));
 *   useKeyboard(['k', 'cmd+k'], () => openSearch());
 *
 * 정책:
 *   - input/textarea 안에서 발생한 키는 무시 (modifier 없는 경우)
 *   - cleanup 자동
 *   - SSR 안전
 *
 * 데스크톱-우선 단축키 모음:
 *   - Esc 로 모달/드롭다운 닫기
 *   - g+h 로 홈으로 (Vim 스타일, 선택)
 */
type KeyHandler = (e: KeyboardEvent) => void;

export function useKeyboard(
  key: string | string[],
  handler: KeyHandler,
  options: { allowInInputs?: boolean; enabled?: boolean } = {},
) {
  const { allowInInputs = false, enabled = true } = options;

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const keys = Array.isArray(key) ? key : [key];

    function listener(e: KeyboardEvent) {
      // input/textarea 안에서는 modifier 없는 키는 무시
      if (!allowInInputs) {
        const target = e.target as HTMLElement;
        const tag = target.tagName;
        const isField =
          tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
        if (isField && !e.metaKey && !e.ctrlKey) return;
      }

      // 'cmd+k' 같은 조합 지원
      const pressed = [
        e.metaKey || e.ctrlKey ? 'cmd' : null,
        e.shiftKey ? 'shift' : null,
        e.altKey ? 'alt' : null,
        e.key.toLowerCase(),
      ]
        .filter(Boolean)
        .join('+');

      if (keys.some((k) => k.toLowerCase() === pressed || k === e.key)) {
        handler(e);
      }
    }

    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [key, handler, allowInInputs, enabled]);
}
