import { QueryClient } from '@tanstack/react-query';
import { act } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authKeys } from '@/features/auth/hooks/use-auth';
import { mockSeeds } from '@/mocks/handlers';
import { server } from '@/mocks/server';
import { useAuthStore } from '@/stores/auth-store';
import { renderHookWithProviders } from '@/test-utils';
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
  avatarUrl: null,
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

describe('useUpdateAvatar / useRemoveAvatar — /me/avatar 뮤테이션', () => {
  beforeEach(() => {
    useAuthStore.getState().setAuth(mockUser);
  });

  it('useUpdateAvatar — 업로드 성공', async () => {
    server.use(
      http.post(`${apiUrl}/me/avatar`, () =>
        HttpResponse.json(
          {
            success: true,
            message: null,
            data: { avatarUrl: 'https://cdn/avatars/1.jpg' },
          },
          { status: 201 },
        ),
      ),
    );
    const { result } = renderHookWithProviders(() => useUpdateAvatar());
    const file = new File([new Uint8Array([1, 2])], 'a.png', {
      type: 'image/png',
    });
    await act(async () => {
      await result.current.mutateAsync(file);
    });
    expect(result.current.isSuccess).toBe(true);
  });

  it('useRemoveAvatar — 삭제 성공', async () => {
    server.use(
      http.delete(`${apiUrl}/me/avatar`, () =>
        HttpResponse.json({
          success: true,
          message: null,
          data: { avatarUrl: null },
        }),
      ),
    );
    const { result } = renderHookWithProviders(() => useRemoveAvatar());
    await act(async () => {
      await result.current.mutateAsync();
    });
    expect(result.current.isSuccess).toBe(true);
  });
});
