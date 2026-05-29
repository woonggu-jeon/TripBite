'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * 콜백 디바운스 hook.
 *
 *   const debounced = useDebouncedCallback(fn, 400);
 *   debounced(arg) → 마지막 호출 이후 delay 동안 추가 호출이 없으면 실행.
 *   debounced.cancel() → 대기 중인 호출 취소.
 *   debounced.flush() → 대기 중인 호출 즉시 실행.
 *
 * 토글 류 액션(좋아요/저장)에 적합:
 *   - 빠른 연속 클릭 시 마지막 의도만 서버로 전송 → race condition / 서버 부담 ↓
 *   - 짝수 번 누르면 원상복귀 → commit 시점에 net change 비교로 no-op 가능
 *
 * 구현 노트:
 *   - fnRef 로 latest closure 캡처 → setTimeout 안에서 stale 한 letter.liked 등을
 *     읽지 않음.
 *   - unmount 시 timer 정리.
 */
export interface DebouncedFn<Args extends unknown[]> {
  (...args: Args): void;
  cancel: () => void;
  flush: () => void;
}

export function useDebouncedCallback<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delay: number,
): DebouncedFn<Args> {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const timer = useRef<number | null>(null);
  const pendingArgs = useRef<Args | null>(null);

  const cancel = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    pendingArgs.current = null;
  }, []);

  const flush = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    const args = pendingArgs.current;
    pendingArgs.current = null;
    if (args) fnRef.current(...args);
  }, []);

  const debounced = useCallback(
    (...args: Args) => {
      pendingArgs.current = args;
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        timer.current = null;
        const a = pendingArgs.current;
        pendingArgs.current = null;
        if (a) fnRef.current(...a);
      }, delay);
    },
    [delay],
  );

  // unmount 시 대기 중인 타이머 정리 (콜백 실행 X — 컴포넌트가 사라지면 의도 무효).
  useEffect(() => cancel, [cancel]);

  // attach cancel/flush as method-like properties without losing the call signature.
  const result = debounced as DebouncedFn<Args>;
  result.cancel = cancel;
  result.flush = flush;
  return result;
}
