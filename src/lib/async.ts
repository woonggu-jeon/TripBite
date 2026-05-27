/**
 * 비동기/타이밍 유틸 — 검색 입력, 스크롤 핸들러, 테스트 지연 등
 */

/** ms 만큼 대기 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * debounce — 마지막 호출 후 wait ms 경과 시 1회 실행 (검색 입력 등)
 * 반환 함수에 .cancel() 제공.
 */
export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  wait: number,
): ((...args: A) => void) & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const debounced = (...args: A) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, wait);
  };
  debounced.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };
  return debounced;
}

/**
 * throttle — 최소 interval ms 간격으로만 실행 (스크롤/리사이즈 등)
 * leading 호출 즉시 실행 + trailing 보장.
 */
export function throttle<A extends unknown[]>(
  fn: (...args: A) => void,
  interval: number,
): (...args: A) => void {
  let last = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: A) => {
    const now = Date.now();
    const remaining = interval - (now - last);
    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      last = now;
      fn(...args);
    } else if (!timer) {
      timer = setTimeout(() => {
        last = Date.now();
        timer = null;
        fn(...args);
      }, remaining);
    }
  };
}
