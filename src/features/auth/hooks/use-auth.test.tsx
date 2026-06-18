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

// SW cache clear — clearAllCaches 는 caches API 의존 (jsdom 없음).
// stub 으로 noop 처리해 logout/signup/reset 분기에서 throw 안 함.
vi.mock('@/lib/sw-cache', () => ({
  clearAllCaches: vi.fn(async () => {}),
}));

const {
  useLogin,
  useSignup,
  useLogout,
  useDeleteAccount,
  useResetPassword,
  useForgotPassword,
  useFindId,
} = await import('./use-auth');

const apiUrl = mockSeeds.apiUrl;

// UserDto: id/username/nickname/email/isOnboarded/homeRegion/avatarUrl(nullable)/travelType(nullable).
// SignupDto 의 name/phone/birthDate 와 다름 (가입 입력 vs 사용자 응답).
const mockUser = {
  id: 'u-1',
  username: 'tester',
  nickname: '여행자',
  email: 't@e.st',
  isOnboarded: true,
  homeRegion: 'cheongju',
  avatarUrl: null,
  travelType: null,
} as const;

/** location.assign 만 spy — happy-dom URL parser 보존. */
function spyLocationAssign() {
  const spy = vi.fn();
  const original = window.location.assign;
  Object.defineProperty(window.location, 'assign', {
    configurable: true,
    value: spy,
  });
  return {
    spy,
    restore: () => {
      Object.defineProperty(window.location, 'assign', {
        configurable: true,
        value: original,
      });
    },
  };
}

describe('useLogin', () => {
  let assignCtl: ReturnType<typeof spyLocationAssign>;

  beforeEach(() => {
    assignCtl = spyLocationAssign();
    router.replace.mockReset();
    router.refresh.mockReset();
    useAuthStore.getState().clearAuth();
  });

  afterEach(() => {
    assignCtl.restore();
    vi.restoreAllMocks();
  });

  it('성공 시 redirectTo 로 window.location.assign 호출', async () => {
    server.use(
      http.post(`${apiUrl}/auth/login`, () =>
        HttpResponse.json({ success: true }),
      ),
      http.get(`${apiUrl}/me`, () => HttpResponse.json(mockUser)),
    );

    const { result } = renderHookWithProviders(() =>
      useLogin({ redirectTo: '/mypage' }),
    );

    await result.current.mutateAsync({
      username: 'tester',
      password: '1234567890',
    });

    await waitFor(() => expect(assignCtl.spy).toHaveBeenCalledTimes(1));
    expect(assignCtl.spy).toHaveBeenCalledWith('/mypage');
    expect(router.refresh).not.toHaveBeenCalled();
  });

  it('redirectTo 미지정 시 "/" 로 fallback', async () => {
    server.use(
      http.post(`${apiUrl}/auth/login`, () =>
        HttpResponse.json({ success: true }),
      ),
      http.get(`${apiUrl}/me`, () => HttpResponse.json(mockUser)),
    );

    const { result } = renderHookWithProviders(() => useLogin());
    await result.current.mutateAsync({
      username: 'tester2',
      password: '1234567890',
    });

    await waitFor(() => expect(assignCtl.spy).toHaveBeenCalledTimes(1));
    expect(assignCtl.spy).toHaveBeenCalledWith('/');
  });

  it('onSuccess 가 store.setAuth 로 user hydrate', async () => {
    server.use(
      http.post(`${apiUrl}/auth/login`, () =>
        HttpResponse.json({ success: true }),
      ),
      http.get(`${apiUrl}/me`, () => HttpResponse.json(mockUser)),
    );

    const { result } = renderHookWithProviders(() => useLogin());
    await result.current.mutateAsync({
      username: 'tester',
      password: '1234567890',
    });

    await waitFor(() => {
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.id).toBe('u-1');
    });
  });
});

describe('useSignup', () => {
  beforeEach(() => {
    router.replace.mockReset();
    router.refresh.mockReset();
    useAuthStore.getState().clearAuth();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('atomic 응답의 user 로 setAuth + router.replace("/onboarding")', async () => {
    server.use(
      http.post(`${apiUrl}/auth/signup`, () =>
        HttpResponse.json({ user: mockUser }),
      ),
    );

    const { result } = renderHookWithProviders(() => useSignup());
    await result.current.mutateAsync({
      username: 'tester01',
      password: 'Abcd1234!@',
      nickname: '여행자',
      email: 't@e.st',
    });

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });
    expect(router.replace).toHaveBeenCalledWith('/onboarding');
  });
});

describe('useLogout', () => {
  let assignCtl: ReturnType<typeof spyLocationAssign>;

  beforeEach(() => {
    assignCtl = spyLocationAssign();
    useAuthStore.getState().setAuth(mockUser);
  });

  afterEach(() => {
    assignCtl.restore();
    vi.restoreAllMocks();
  });

  it('성공 시 clearAuth + window.location.assign("/")', async () => {
    server.use(
      http.post(`${apiUrl}/auth/logout`, () =>
        HttpResponse.json({ success: true }),
      ),
    );

    const { result } = renderHookWithProviders(() => useLogout());
    await result.current.mutateAsync();

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
    expect(assignCtl.spy).toHaveBeenCalledWith('/');
  });

  it('mutation 실패해도 onSettled 가 clearAuth + assign("/") 호출', async () => {
    server.use(
      http.post(
        `${apiUrl}/auth/logout`,
        () => new HttpResponse(null, { status: 500 }),
      ),
    );

    const { result } = renderHookWithProviders(() => useLogout());
    await result.current.mutateAsync().catch(() => {});

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
    expect(assignCtl.spy).toHaveBeenCalledWith('/');
  });
});

describe('useDeleteAccount', () => {
  let assignCtl: ReturnType<typeof spyLocationAssign>;

  beforeEach(() => {
    assignCtl = spyLocationAssign();
    useAuthStore.getState().setAuth(mockUser);
  });

  afterEach(() => {
    assignCtl.restore();
    vi.restoreAllMocks();
  });

  it('성공 시 clearAuth + window.location.assign("/")', async () => {
    server.use(
      http.delete(
        `${apiUrl}/me`,
        () => new HttpResponse(null, { status: 204 }),
      ),
    );

    const { result } = renderHookWithProviders(() => useDeleteAccount());
    await result.current.mutateAsync();

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
    expect(assignCtl.spy).toHaveBeenCalledWith('/');
  });

  it('실패 시 store cleanup 안 함 (탈퇴 의도 실패 — 사용자 retry 가능) + assign 그대로 호출', async () => {
    server.use(
      http.delete(
        `${apiUrl}/me`,
        () => new HttpResponse(null, { status: 500 }),
      ),
    );

    const { result } = renderHookWithProviders(() => useDeleteAccount());
    await result.current.mutateAsync().catch(() => {});

    // 실패 시 store 는 그대로 (setAuth 한 상태 유지) — useDeleteAccount 의 onSettled
    // 가 if(!error) 분기로 cleanup 분리. assign 은 항상 호출.
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(assignCtl.spy).toHaveBeenCalledWith('/');
  });
});

describe('useResetPassword', () => {
  beforeEach(() => {
    router.replace.mockReset();
    router.refresh.mockReset();
    useAuthStore.getState().setAuth(mockUser);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('성공 시 logout 호출 + clearAuth + router.replace("/login?reset=success")', async () => {
    server.use(
      http.post(`${apiUrl}/auth/reset-password`, () =>
        HttpResponse.json({ success: true }),
      ),
      http.post(`${apiUrl}/auth/logout`, () =>
        HttpResponse.json({ success: true }),
      ),
    );

    const { result } = renderHookWithProviders(() => useResetPassword());
    await result.current.mutateAsync({
      token: 't-1',
      password: 'newpass1234',
    });

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
    expect(router.replace).toHaveBeenCalledWith('/login?reset=success');
  });
});

describe('useForgotPassword / useFindId — mutation only (분기 없음)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('useForgotPassword 가 POST /auth/forgot-password 호출', async () => {
    const calls: unknown[] = [];
    server.use(
      http.post(`${apiUrl}/auth/forgot-password`, async ({ request }) => {
        calls.push(await request.json());
        return HttpResponse.json({ success: true });
      }),
    );

    const { result } = renderHookWithProviders(() => useForgotPassword());
    await result.current.mutateAsync({ username: 'tester01', email: 't@e.st' });

    expect(calls).toHaveLength(1);
  });

  it('useFindId 가 POST /auth/find-id 호출 후 username 반환', async () => {
    server.use(
      http.post(`${apiUrl}/auth/find-id`, () =>
        HttpResponse.json({ username: 'foundUser' }),
      ),
    );

    const { result } = renderHookWithProviders(() => useFindId());
    const res = await result.current.mutateAsync({
      email: 't@e.st',
    });

    expect(res.username).toBe('foundUser');
  });
});
