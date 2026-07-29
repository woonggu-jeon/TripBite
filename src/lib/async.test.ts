import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { debounce, sleep, throttle } from './async';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('sleep', () => {
  it('지정 ms 후 resolve', async () => {
    const fn = vi.fn();
    void sleep(100).then(fn);
    expect(fn).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(100);
    expect(fn).toHaveBeenCalled();
  });
});

describe('debounce', () => {
  it('마지막 호출만 1회 실행', () => {
    const fn = vi.fn();
    const d = debounce(fn, 200);
    d('a');
    d('b');
    d('c');
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('c');
  });

  it('cancel로 실행 취소', () => {
    const fn = vi.fn();
    const d = debounce(fn, 200);
    d('x');
    d.cancel();
    vi.advanceTimersByTime(200);
    expect(fn).not.toHaveBeenCalled();
  });
});

describe('throttle', () => {
  it('leading 즉시 실행 + interval 제한', () => {
    const fn = vi.fn();
    const t = throttle(fn, 200);
    t('a'); // 즉시
    t('b'); // 무시(trailing 예약)
    expect(fn).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(2); // trailing
  });
});
