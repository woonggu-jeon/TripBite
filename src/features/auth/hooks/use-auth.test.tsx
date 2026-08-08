import { waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockSeeds } from '@/mocks/handlers';
import { server } from '@/mocks/server';
import { useAuthStore } from '@/stores/auth-store';
import { createRouterMock, renderHookWithProviders } from '@/test-utils';

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

const { useLogin, useSignup, useLogout, useMe } = await import('./use-auth');

const apiUrl = mockSeeds.apiUrl;

// UserDto (Spring UserResponseDto 파생 뷰) — id/username/nickname/email.
const mockUser = {
  id: 'u-1',
  username: 'tester',
  nickname: '여행자',
  email: 't@e.st',
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
      http.get(`${apiUrl}/me`, () =>
        HttpResponse.json({ success: true, message: null, data: mockUser }),
      ),
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
      http.get(`${apiUrl}/me`, () =>
        HttpResponse.json({ success: true, message: null, data: mockUser }),
      ),
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
      http.get(`${apiUrl}/me`, () =>
        HttpResponse.json({ success: true, message: null, data: mockUser }),
      ),
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

  it('가입 시 pendingSignupUser 만 설정 + router.replace("/signup/complete") — setAuth 는 시작하기 클릭 시점으로 분리', async () => {
    // 신규 Spring BE: signup 응답은 ApiResponseUnit(user 없음) → 폼 입력값으로 pendingUser 구성.
    server.use(
      http.post(`${apiUrl}/auth/signup`, () =>
        HttpResponse.json({ success: true, message: null, data: {} }),
      ),
    );

    const { result } = renderHookWithProviders(() => useSignup());
    await result.current.mutateAsync({
      username: 'tester01',
      password: 'Abcd1234!@',
      name: '홍길동',
      birthDate: '1998-05-20',
      nickname: '여행자',
      email: 't@e.st',
    });

    await waitFor(() => {
      // 가입 직후엔 isAuthenticated false 유지 — pendingSignupUser(입력값 기반) 만 set.
      expect(useAuthStore.getState().pendingSignupUser?.nickname).toBe(
        '여행자',
      );
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(router.replace).toHaveBeenCalledWith('/signup/complete');
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

describe('useMe', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('persisted user 있으면 initialData 로 즉시 success + 백그라운드 refetch', async () => {
    useAuthStore.getState().setAuth(mockUser);
    let fetchCount = 0;
    const refreshed = { ...mockUser, nickname: '갱신됨' };
    server.use(
      http.get(`${apiUrl}/me`, () => {
        fetchCount += 1;
        return HttpResponse.json({
          success: true,
          message: null,
          data: refreshed,
        });
      }),
    );

    const { result } = renderHookWithProviders(() => useMe());
    // initialData hydrate — mount 즉시 user 있음
    expect(result.current.data?.nickname).toBe('여행자');
    // 백그라운드 refetch (initialDataUpdatedAt=0 으로 즉시 stale)
    await waitFor(() => expect(result.current.data?.nickname).toBe('갱신됨'));
    expect(fetchCount).toBe(1);
  });

  it('401 응답 시 retry 안 함 (failureCount=0 + 401 분기)', async () => {
    let fetchCount = 0;
    server.use(
      http.get(`${apiUrl}/me`, () => {
        fetchCount += 1;
        return new HttpResponse(null, { status: 401 });
      }),
    );

    const { result } = renderHookWithProviders(() => useMe());
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(fetchCount).toBe(1); // retry 0
  });

  it('5xx 응답 시 1회 retry (failureCount<1 분기)', async () => {
    let fetchCount = 0;
    server.use(
      http.get(`${apiUrl}/me`, () => {
        fetchCount += 1;
        return new HttpResponse(null, { status: 500 });
      }),
    );

    const { result } = renderHookWithProviders(() => useMe());
    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 3000,
    });
    expect(fetchCount).toBe(2); // 초기 + retry 1
  });
});
