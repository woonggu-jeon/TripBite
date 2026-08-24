import { beforeEach, describe, expect, it, vi } from 'vitest';
import { shareWithImage } from '@/lib/share';
import { toast } from '@/lib/toast';
import { renderHookWithProviders } from '@/test-utils';
import { useShareCard } from './use-share-card';

vi.mock('@/lib/share', () => ({
  shareWithImage: vi.fn(),
}));

vi.mock('@/lib/toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    dismiss: vi.fn(),
  },
}));

describe('useShareCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("status='copied' → toast.success(shareLinkCopied)", async () => {
    vi.mocked(shareWithImage).mockResolvedValueOnce('copied');
    const { result } = renderHookWithProviders(() => useShareCard());
    await result.current({ imageUrl: '/api/og/x', filename: 'x.png' });
    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("status='copied-image' → toast.success(shareImageCopied)", async () => {
    vi.mocked(shareWithImage).mockResolvedValueOnce('copied-image');
    const { result } = renderHookWithProviders(() => useShareCard());
    await result.current({ imageUrl: '/api/og/x', filename: 'x.png' });
    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("status='copied-and-downloaded' → toast.success", async () => {
    vi.mocked(shareWithImage).mockResolvedValueOnce('copied-and-downloaded');
    const { result } = renderHookWithProviders(() => useShareCard());
    await result.current({ imageUrl: '/api/og/x', filename: 'x.png' });
    expect(toast.success).toHaveBeenCalledTimes(1);
  });

  it("status='downloaded' → toast.success", async () => {
    vi.mocked(shareWithImage).mockResolvedValueOnce('downloaded');
    const { result } = renderHookWithProviders(() => useShareCard());
    await result.current({ imageUrl: '/api/og/x', filename: 'x.png' });
    expect(toast.success).toHaveBeenCalledTimes(1);
  });

  it("status='failed' → toast.error", async () => {
    vi.mocked(shareWithImage).mockResolvedValueOnce('failed');
    const { result } = renderHookWithProviders(() => useShareCard());
    await result.current({ imageUrl: '/api/og/x', filename: 'x.png' });
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("status='shared' / 'cancelled' → silent (no toast)", async () => {
    vi.mocked(shareWithImage).mockResolvedValueOnce('shared');
    const { result } = renderHookWithProviders(() => useShareCard());
    await result.current({ imageUrl: '/api/og/x', filename: 'x.png' });
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });
});
