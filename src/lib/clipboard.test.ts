import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyToClipboard } from './clipboard';

afterEach(() => vi.restoreAllMocks());

describe('copyToClipboard', () => {
  it('navigator.clipboard.writeText 성공 시 true', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
      writable: true,
    });
    const ok = await copyToClipboard('hello');
    expect(ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith('hello');
  });

  it('clipboard 실패 시 execCommand fallback', async () => {
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockRejectedValue(new Error('denied')),
      },
      configurable: true,
      writable: true,
    });
    const exec = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, 'execCommand', {
      value: exec,
      configurable: true,
      writable: true,
    });
    const ok = await copyToClipboard('fallback');
    expect(ok).toBe(true);
    expect(exec).toHaveBeenCalledWith('copy');
  });
});
