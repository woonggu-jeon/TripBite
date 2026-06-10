import { describe, it, expect } from 'vitest';
import { act, waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { renderHookWithProviders } from '@/test-utils';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { mockSeeds } from '@/mocks/handlers';
import {
  letterKeys,
  useToggleLikeLetter,
  useToggleSaveLetter,
} from './use-letters';
import type { Letter } from '@/features/letter/types';

// handlers.ts 와 같은 base — test 환경에선 baseURL undefined 라 path-only 매칭.
const apiUrl = mockSeeds.apiUrl;

function makeLetter(over: Partial<Letter> = {}): Letter {
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

    const cached = qc.getQueryData<Letter>(letterKeys.detail('l-1'));
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
      const cached = qc.getQueryData<Letter>(letterKeys.detail('l-1'));
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

    const cached = qc.getQueryData<Letter>(letterKeys.detail('l-2'));
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
