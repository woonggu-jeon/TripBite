import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { mockSeeds } from '@/mocks/handlers';
import { renderWithProviders, createRouterMock } from '@/test-utils';
import { useAuthStore } from '@/stores/auth-store';

const router = createRouterMock();
const pathnameMock = vi.fn<() => string>(() => '/');

vi.mock('next/navigation', async () => {
  const actual =
    await vi.importActual<typeof import('next/navigation')>('next/navigation');
  return {
    ...actual,
    useRouter: () => router,
    usePathname: () => pathnameMock(),
  };
});

// AuthBootstrap 은 vi.mock 호이스팅 이후 import 되어야 next/navigation mock 적용됨.
const { AuthBootstrap } = await import('./AuthBootstrap');

const apiUrl = mockSeeds.apiUrl;

function setPath(p: string) {
  pathnameMock.mockReturnValue(p);
}

function stubMe200(body: object) {
  server.use(http.get(`${apiUrl}/me`, () => HttpResponse.json(body)));
}
function stubMe401() {
  server.use(
    http.get(`${apiUrl}/me`, () => new HttpResponse(null, { status: 401 })),
  );
}

// 2026-06-12 — AuthBootstrap mount 자체를 비활성화 (providers.tsx). 인증 redirect
// 는 middleware, 만료 SID 는 interceptor 가 담당. 본 describe 의 store sync
// 검증은 의미 약해졌으나 회귀 원복 시 그대로 복원 가능하도록 describe.skip 적용.
describe.skip('AuthBootstrap — 4 redirect 분기 [mount 비활성]', () => {
  beforeEach(() => {
    router.replace.mockReset();
    router.push.mockReset();
    useAuthStore.getState().clearAuth();
    localStorage.removeItem('tripbite.onboarded');
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('인증 + onboarded=true + /  → no redirect', async () => {
    setPath('/');
    stubMe200({
      id: 'u-1',
      email: 'a@b.c',
      nickname: '여행자',
      isOnboarded: true,
    });

    renderWithProviders(<AuthBootstrap />);

    // 짧은 대기 — useMe resolve 이후 effect 실행
    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });
    expect(router.replace).not.toHaveBeenCalled();
  });

  // 2026-06-12 — 인증 redirect 책임이 middleware 로 이전됨 (보호 경로 + SID 없음
  // → SSR redirect). AuthBootstrap 은 /me 동기화만 담당. 회귀 시 분기 + 본 테스트
  // 함께 원복.
  it.skip('비인증 + 보호 경로 (/mypage) → /login?redirect=... replace [middleware 이전]', async () => {
    setPath('/mypage');
    stubMe401();

    renderWithProviders(<AuthBootstrap />);

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith(
        expect.stringMatching(/^\/login\?redirect=/),
      );
    });
  });

  it('비인증 + public 경로 (/) → no redirect (onboarding 은 middleware 책임)', async () => {
    setPath('/');
    stubMe401();

    renderWithProviders(<AuthBootstrap />);

    await new Promise((r) => setTimeout(r, 100));
    expect(router.replace).not.toHaveBeenCalled();
  });
});
