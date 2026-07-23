import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { mockSeeds } from '@/mocks/handlers';
import { renderHookWithProviders } from '@/test-utils';
import { useAuthStore } from '@/stores/auth-store';
import { authKeys } from '@/features/auth/hooks/use-auth';
import {
  mypageKeys,
  useMypage,
  useRemoveAvatar,
  useStamps,
  useUpdateAvatar,
  useUpdateNickname,
} from './use-mypage';

const apiUrl = mockSeeds.apiUrl;

const mockUser = {
  id: 'u-1',
  username: 'tester',
  nickname: '여행자',
  email: 't@e.st',
  isOnboarded: true,
} as const;

describe('useMypage / useStamps — enabled: isAuthenticated 가드', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('useMypage — 비인증 시 fetchStatus="idle" (fetch 0)', () => {
    let called = 0;
    server.use(
      http.get(`${apiUrl}/mypage`, () => {
        called++;
        return HttpResponse.json({});
      }),
    );

    const { result } = renderHookWithProviders(() => useMypage());
    expect(result.current.fetchStatus).toBe('idle');
    expect(called).toBe(0);
  });

  it('useStamps — 비인증 시 fetchStatus="idle" (fetch 0)', () => {
    let called = 0;
    server.use(
      http.get(`${apiUrl}/mypage/stamps`, () => {
        called++;
        return HttpResponse.json({ stamps: [] });
      }),
    );

    const { result } = renderHookWithProviders(() => useStamps());
    expect(result.current.fetchStatus).toBe('idle');
    expect(called).toBe(0);
  });
});

describe('useUpdateNickname', () => {
  it('성공 시 mypage summary + auth.me 양쪽 invalidate', async () => {
    server.use(
      http.patch(`${apiUrl}/me`, () =>
        HttpResponse.json({ success: true, message: null, data: mockUser }),
      ),
    );
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');

    const { result } = renderHookWithProviders(() => useUpdateNickname(), {
      queryClient: qc,
    });
    await act(async () => {
      await result.current.mutateAsync({ nickname: '새닉네임' });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: mypageKeys.summary(),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: authKeys.me() });
  });
});

describe('useUpdateAvatar', () => {
  it('성공 시 auth.me + mypage summary 양쪽 invalidate (multipart FormData)', async () => {
    let receivedContentType = '';
    server.use(
      http.post(`${apiUrl}/me/avatar`, ({ request }) => {
        receivedContentType = request.headers.get('content-type') ?? '';
        return HttpResponse.json({ avatarUrl: 'https://cdn.test/avatar.png' });
      }),
    );
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');

    const { result } = renderHookWithProviders(() => useUpdateAvatar(), {
      queryClient: qc,
    });
    const file = new File(['x'], 'avatar.png', { type: 'image/png' });
    await act(async () => {
      await result.current.mutateAsync(file);
    });

    // axios FormData interceptor 가 Content-Type 직접 unset → 브라우저가 multipart boundary 자동 부여.
    expect(receivedContentType).toMatch(/multipart\/form-data/);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: authKeys.me() });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: mypageKeys.summary(),
    });
  });
});

describe('useRemoveAvatar', () => {
  it('성공 시 auth.me + mypage summary 양쪽 invalidate', async () => {
    server.use(
      http.delete(
        `${apiUrl}/me/avatar`,
        () => new HttpResponse(null, { status: 204 }),
      ),
    );
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');

    const { result } = renderHookWithProviders(() => useRemoveAvatar(), {
      queryClient: qc,
    });
    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: authKeys.me() });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: mypageKeys.summary(),
    });
  });
});
