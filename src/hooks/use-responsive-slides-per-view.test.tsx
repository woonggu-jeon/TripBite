import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useResponsiveSlidesPerView } from './use-responsive-slides-per-view';

function setViewport(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    value: width,
    writable: true,
    configurable: true,
  });
  window.dispatchEvent(new Event('resize'));
}

describe('useResponsiveSlidesPerView', () => {
  beforeEach(() => {
    setViewport(1024);
  });

  it('360 이하 → 1.8', () => {
    setViewport(360);
    const { result } = renderHook(() => useResponsiveSlidesPerView());
    expect(result.current).toBe(1.8);
  });

  it('480 이하 (361~480) → 2.2', () => {
    setViewport(420);
    const { result } = renderHook(() => useResponsiveSlidesPerView());
    expect(result.current).toBe(2.2);
  });

  it('481 이상 → 3 (default fallback)', () => {
    setViewport(1024);
    const { result } = renderHook(() => useResponsiveSlidesPerView());
    expect(result.current).toBe(3);
  });

  it('viewport resize 시 값 갱신', () => {
    setViewport(1024);
    const { result } = renderHook(() => useResponsiveSlidesPerView());
    expect(result.current).toBe(3);
    act(() => setViewport(360));
    expect(result.current).toBe(1.8);
    act(() => setViewport(420));
    expect(result.current).toBe(2.2);
  });

  it('커스텀 breakpoint 적용', () => {
    setViewport(700);
    const { result } = renderHook(() =>
      useResponsiveSlidesPerView(
        [
          { maxWidth: 600, value: 2 },
          { maxWidth: 900, value: 4 },
        ],
        6,
      ),
    );
    expect(result.current).toBe(4);
    act(() => setViewport(500));
    expect(result.current).toBe(2);
    act(() => setViewport(1200));
    expect(result.current).toBe(6);
  });
});
