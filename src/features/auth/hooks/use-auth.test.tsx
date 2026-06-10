import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { mockSeeds } from '@/mocks/handlers';
import { renderHookWithProviders, createRouterMock } from '@/test-utils';
import { useAuthStore } from '@/stores/auth-store';

const router = createRouterMock();
vi.mock('next/navigation', async () => {
  const actual =
    await vi.importActual<typeof import('next/navigation')>('next/navigation');
  return { ...actual, useRouter: () => router };
});

const { useLogin } = await import('./use-auth');

const apiUrl = mockSeeds.apiUrl;

/**
 * useLogin onSuccess 의 hard navigation 검증.
 *
 * 회귀 사유: `router.replace + router.refresh` 가 (auth)↔(main) 그룹 교체 / RSC client cache
 * stale / AuthBootstrap onboarding 분기 / refresh-vs-replace 순서 race 누적으로 returnUrl
 * 진입 실패. fix 는 `window.location.assign(target)` hard navigation — 1회 full reload
 * 비용으로 race 우회.
 */
describe('useLogin', () => {
  let assignSpy: ReturnType<typeof vi.fn>;
  let originalAssign: typeof window.location.assign;

  beforeEach(() => {
    assignSpy = vi.fn();
    originalAssign = window.location.assign;
    // location.assign 메서드만 spy — location 자체 재정의는 happy-dom URL parser 깨짐.
    Object.defineProperty(window.location, 'assign', {
      configurable: true,
      value: assignSpy,
    });
    router.replace.mockReset();
    router.refresh.mockReset();
    useAuthStore.getState().clearAuth();
  });

  afterEach(() => {
    Object.defineProperty(window.location, 'assign', {
      configurable: true,
      value: originalAssign,
    });
    vi.restoreAllMocks();
  });

  it('성공 시 redirectTo 로 window.location.assign 호출', async () => {
    server.use(
      http.post(`${apiUrl}/v1/auth/login`, () =>
        HttpResponse.json({ success: true }),
      ),
      http.get(`${apiUrl}/me`, () =>
        HttpResponse.json({
          id: 'u-1',
          username: 'tester',
          name: '여행자',
          email: 't@e.st',
          phone: '01000000000',
          birthDate: '1990-01-01',
          isOnboarded: true,
        }),
      ),
    );

    const { result } = renderHookWithProviders(() =>
      useLogin({ redirectTo: '/mypage' }),
    );

    await result.current.mutateAsync({
      username: 'tester',
      password: '1234567890',
    });

    await waitFor(() => expect(assignSpy).toHaveBeenCalledTimes(1));
    expect(assignSpy).toHaveBeenCalledWith('/mypage');
    // refresh 호출 안 함 (race 회피)
    expect(router.refresh).not.toHaveBeenCalled();
  });

  it('redirectTo 미지정 시 "/" 로 fallback', async () => {
    server.use(
      http.post(`${apiUrl}/v1/auth/login`, () =>
        HttpResponse.json({ success: true }),
      ),
      http.get(`${apiUrl}/me`, () =>
        HttpResponse.json({
          id: 'u-2',
          username: 'tester2',
          name: '여행자',
          email: 't2@e.st',
          phone: '01000000001',
          birthDate: '1990-01-01',
          isOnboarded: true,
        }),
      ),
    );

    const { result } = renderHookWithProviders(() => useLogin());
    await result.current.mutateAsync({
      username: 'tester2',
      password: '1234567890',
    });

    await waitFor(() => expect(assignSpy).toHaveBeenCalledTimes(1));
    expect(assignSpy).toHaveBeenCalledWith('/');
  });
});
