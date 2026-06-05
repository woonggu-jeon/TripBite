import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { mockSeeds } from '@/mocks/handlers';
import { renderWithProviders, createRouterMock } from '@/test-utils';
import { useAuthStore } from '@/stores/auth-store';
import { localOnboarding } from '@/features/onboarding/hooks/use-local-onboarding';

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

describe('AuthBootstrap — 4 redirect 분기', () => {
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

  it('인증 + onboarded=false + / → /onboarding 으로 replace', async () => {
    setPath('/');
    stubMe200({
      id: 'u-2',
      email: 'a@b.c',
      nickname: '여행자',
      isOnboarded: false,
    });
    // localStorage 도 false — backendOnboarded ?? true 회피 위해 isOnboarded:false 명시
    localOnboarding.write(false);

    renderWithProviders(<AuthBootstrap />);

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/onboarding');
    });
  });

  it('인증 + onboarded=true + /onboarding → / 로 replace', async () => {
    setPath('/onboarding');
    stubMe200({
      id: 'u-3',
      email: 'a@b.c',
      nickname: '여행자',
      isOnboarded: true,
    });

    renderWithProviders(<AuthBootstrap />);

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/');
    });
  });

  it('비인증 + localStorage 없음 + / → /onboarding 으로 replace (첫 방문 안내)', async () => {
    setPath('/');
    stubMe401();
    // localStorage 없음 기본 — 첫 방문자는 onboarding 으로 안내

    renderWithProviders(<AuthBootstrap />);

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/onboarding');
    });
  });

  it('비인증 + localStorage onboarded → 진입 가능 (no redirect)', async () => {
    setPath('/');
    stubMe401();
    localOnboarding.write(true);

    renderWithProviders(<AuthBootstrap />);

    // 충분히 기다림 — 그래도 replace 호출 안 됨을 확인
    await new Promise((r) => setTimeout(r, 100));
    expect(router.replace).not.toHaveBeenCalled();
  });
});
