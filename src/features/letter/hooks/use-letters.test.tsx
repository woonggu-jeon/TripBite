import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { renderHookWithProviders } from '@/test-utils';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { mockSeeds } from '@/mocks/handlers';
import {
  letterKeys,
  useDeleteLetter,
  useLetter,
  useLettersInfinite,
  useSendLetter,
  useToggleLikeLetter,
  useToggleSaveLetter,
} from './use-letters';
import { useAuthStore } from '@/stores/auth-store';
import type { LetterDto } from '@/api/generated/schemas';

// handlers.ts 와 같은 base — test 환경에선 baseURL undefined 라 path-only 매칭.
const apiUrl = mockSeeds.apiUrl;

function makeLetter(over: Partial<LetterDto> = {}): LetterDto {
  return {
    id: 'l-1',
    body: '잘있어요',
    author: { nickname: '여행자', location: '청주' },
    arrivedAt: '2026-06-01T00:00:00Z',
    createdAt: '2026-06-01T00:00:00Z',
    isMine: false,
    liked: false,
    saved: false,
    likeCount: 5,
    read: false,
    ...over,
  };
}

describe('useToggleLikeLetter', () => {
  function stubLikeOk() {
    server.use(
      http.post(`${apiUrl}/letters/:id/like`, ({ params }) =>
        HttpResponse.json(makeLetter({ id: params.id as string, liked: true })),
      ),
    );
  }
  function stubLikeFail() {
    server.use(
      http.post(`${apiUrl}/letters/:id/like`, () =>
        HttpResponse.json({ error: 'boom' }, { status: 500 }),
      ),
    );
  }

  it('onMutate — cache 즉시 토글 + likeCount 증가', async () => {
    stubLikeOk();
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    qc.setQueryData(letterKeys.detail('l-1'), makeLetter());

    const { result } = renderHookWithProviders(() => useToggleLikeLetter(), {
      queryClient: qc,
    });

    await act(async () => {
      await result.current.mutateAsync('l-1');
    });

    const cached = qc.getQueryData<LetterDto>(letterKeys.detail('l-1'));
    expect(cached?.liked).toBe(true);
    expect(cached?.likeCount).toBe(6);
  });

  it('onError — 서버 실패 시 snapshot 으로 롤백', async () => {
    stubLikeFail();

    const qc = new QueryClient({
      defaultOptions: {
        // gcTime 0 이면 inactive cache 즉시 삭제 — rollback 검증이 깨짐.
        queries: { retry: false, gcTime: 60_000 },
        mutations: { retry: false },
      },
    });
    const original = makeLetter({ liked: false, likeCount: 5 });
    qc.setQueryData(letterKeys.detail('l-1'), original);

    const { result } = renderHookWithProviders(() => useToggleLikeLetter(), {
      queryClient: qc,
    });

    await act(async () => {
      try {
        await result.current.mutateAsync('l-1');
      } catch {
        // expected 500
      }
    });

    await waitFor(() => {
      const cached = qc.getQueryData<LetterDto>(letterKeys.detail('l-1'));
      // 롤백 — 원본 그대로
      expect(cached?.liked).toBe(false);
      expect(cached?.likeCount).toBe(5);
    });
  });
});

describe('useToggleSaveLetter', () => {
  function stubSaveOk() {
    server.use(
      http.post(`${apiUrl}/letters/:id/save`, ({ params }) =>
        HttpResponse.json(makeLetter({ id: params.id as string, saved: true })),
      ),
    );
  }
  function stubSaveFail404() {
    server.use(
      http.post(
        `${apiUrl}/letters/:id/save`,
        () => new HttpResponse(null, { status: 404 }),
      ),
    );
  }

  it('onMutate — saved 토글 (count 영향 X)', async () => {
    stubSaveOk();
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    qc.setQueryData(
      letterKeys.detail('l-2'),
      makeLetter({ id: 'l-2', saved: false }),
    );

    const { result } = renderHookWithProviders(() => useToggleSaveLetter(), {
      queryClient: qc,
    });

    await act(async () => {
      await result.current.mutateAsync('l-2');
    });

    const cached = qc.getQueryData<LetterDto>(letterKeys.detail('l-2'));
    expect(cached?.saved).toBe(true);
  });

  it('detail 없는 letter id 토글 — no-op (안전)', async () => {
    stubSaveFail404();
    const qc = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    });

    const { result } = renderHookWithProviders(() => useToggleSaveLetter(), {
      queryClient: qc,
    });

    // detail cache 없음 → onMutate 가 no-op 처리. mock handler 가 404 반환.
    await act(async () => {
      try {
        await result.current.mutateAsync('l-missing');
      } catch {
        // expected 404
      }
    });

    expect(qc.getQueryData(letterKeys.detail('l-missing'))).toBeUndefined();
  });
});

describe('useSendLetter', () => {
  it('성공 시 sent list invalidateQueries 호출', async () => {
    server.use(
      http.post(`${apiUrl}/letters`, () =>
        HttpResponse.json(makeLetter({ id: 'l-new' })),
      ),
    );
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');

    const { result } = renderHookWithProviders(() => useSendLetter(), {
      queryClient: qc,
    });
    await act(async () => {
      await result.current.mutateAsync({
        body: '잘있어',
        location: { label: '청주시 어딘가', regionCode: 'cheongju' },
      });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: letterKeys.list('sent'),
    });
  });

  it('Idempotency-Key 헤더 전송 (BE dedup — letter 중복 생성 방지)', async () => {
    let capturedKey: string | null = null;
    server.use(
      http.post(`${apiUrl}/letters`, ({ request }) => {
        capturedKey = request.headers.get('Idempotency-Key');
        return HttpResponse.json(makeLetter({ id: 'l-idem' }));
      }),
    );
    const { result } = renderHookWithProviders(() => useSendLetter());
    await act(async () => {
      await result.current.mutateAsync({
        body: '잘있어',
        location: { label: '청주시 어딘가', regionCode: 'cheongju' },
      });
    });
    expect(capturedKey).toBeTruthy();
    expect(capturedKey).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });
});

describe('useDeleteLetter', () => {
  it('성공 시 detail removeQueries + 4 list invalidateQueries 호출', async () => {
    server.use(
      http.delete(
        `${apiUrl}/letters/:id`,
        () => new HttpResponse(null, { status: 204 }),
      ),
    );
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    qc.setQueryData(letterKeys.detail('l-del'), makeLetter({ id: 'l-del' }));
    const removeSpy = vi.spyOn(qc, 'removeQueries');
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');

    const { result } = renderHookWithProviders(() => useDeleteLetter(), {
      queryClient: qc,
    });
    await act(async () => {
      await result.current.mutateAsync('l-del');
    });

    expect(removeSpy).toHaveBeenCalledWith({
      queryKey: letterKeys.detail('l-del'),
    });
    // 4 list 모두 invalidate (received/sent/liked/saved)
    for (const kind of ['received', 'sent', 'liked', 'saved'] as const) {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: letterKeys.list(kind),
      });
    }
  });
});

describe('enabled: isAuthenticated 가드', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('useLettersInfinite — 비인증 시 query 비활성 (fetch 0)', () => {
    let called = 0;
    server.use(
      http.get(`${apiUrl}/letters/received`, () => {
        called++;
        return HttpResponse.json({ items: [], nextCursor: null });
      }),
    );
    const { result } = renderHookWithProviders(() =>
      useLettersInfinite('received'),
    );
    // 비인증 → enabled false → fetchStatus 'idle' (pending X)
    expect(result.current.fetchStatus).toBe('idle');
    expect(called).toBe(0);
  });

  it('useLetter — id 있어도 비인증 시 query 비활성', () => {
    let called = 0;
    server.use(
      http.get(`${apiUrl}/letters/:id`, () => {
        called++;
        return HttpResponse.json(makeLetter());
      }),
    );
    const { result } = renderHookWithProviders(() => useLetter('l-1'));
    expect(result.current.fetchStatus).toBe('idle');
    expect(called).toBe(0);
  });

  it('useLetter — id 빈 문자열이면 query 비활성 (`!!id` 분기)', () => {
    useAuthStore.getState().setAuth({
      id: 'u-1',
      username: 'tester',
      nickname: '여행자',
      email: 't@e.st',
      isOnboarded: true,
      homeRegion: 'cheongju',
      avatarUrl: null,
      travelType: null,
    });
    let called = 0;
    server.use(
      http.get(`${apiUrl}/letters/:id`, () => {
        called++;
        return HttpResponse.json(makeLetter());
      }),
    );
    const { result } = renderHookWithProviders(() => useLetter(''));
    expect(result.current.fetchStatus).toBe('idle');
    expect(called).toBe(0);
  });
});

describe('useLettersInfinite — kind 별 분기', () => {
  beforeEach(() => {
    useAuthStore.getState().setAuth({
      id: 'u-1',
      username: 'tester',
      nickname: '여행자',
      email: 't@e.st',
      isOnboarded: true,
      homeRegion: 'cheongju',
      avatarUrl: null,
      travelType: null,
    });
  });

  it('sent kind — CACHE.user 프로필 분기 + fetch 성공', async () => {
    server.use(
      http.get(`${apiUrl}/letters/sent`, () =>
        HttpResponse.json({
          items: [makeLetter()],
          nextCursor: null,
        }),
      ),
    );
    const { result } = renderHookWithProviders(() =>
      useLettersInfinite('sent'),
    );
    await waitFor(() =>
      expect(result.current.data?.pages[0]?.items).toHaveLength(1),
    );
  });

  it('saved kind — CACHE.user 분기 동일', async () => {
    server.use(
      http.get(`${apiUrl}/letters/saved`, () =>
        HttpResponse.json({
          items: [makeLetter(), makeLetter()],
          nextCursor: null,
        }),
      ),
    );
    const { result } = renderHookWithProviders(() =>
      useLettersInfinite('saved'),
    );
    await waitFor(() =>
      expect(result.current.data?.pages[0]?.items).toHaveLength(2),
    );
  });

  it('nextCursor 가 있으면 hasNextPage true', async () => {
    server.use(
      http.get(`${apiUrl}/letters/received`, () =>
        HttpResponse.json({
          items: [makeLetter()],
          nextCursor: 5, // 다음 페이지 있음
        }),
      ),
    );
    const { result } = renderHookWithProviders(() =>
      useLettersInfinite('received'),
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(true);
  });
});
