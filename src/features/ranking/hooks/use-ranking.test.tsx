import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { mockSeeds } from '@/mocks/handlers';
import { renderHookWithProviders } from '@/test-utils';
import { useAuthStore } from '@/stores/auth-store';
import {
  rankingKeys,
  useMyTravelType,
  useSetMyTravelType,
  useSubmitTravelType,
} from './use-ranking';

const apiUrl = mockSeeds.apiUrl;

const mockTravelType = {
  code: 'explorer',
  title: '탐험형 여행자',
  description: '탐험형',
  keywords: ['#탐험'],
  emoji: '🏛️',
  recommended: [],
} as const;

describe('useMyTravelType — enabled: isAuthenticated 가드', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('비인증 시 fetch 0', () => {
    let called = 0;
    server.use(
      http.get(`${apiUrl}/travel-types/me`, () => {
        called++;
        return HttpResponse.json(mockTravelType);
      }),
    );
    const { result } = renderHookWithProviders(() => useMyTravelType());
    expect(result.current.fetchStatus).toBe('idle');
    expect(called).toBe(0);
  });
});

describe('useSubmitTravelType', () => {
  it('성공 시 travelType cache 에 직접 setQueryData', async () => {
    server.use(
      http.post(`${apiUrl}/travel-types/submit`, () =>
        HttpResponse.json(mockTravelType),
      ),
    );
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });

    const { result } = renderHookWithProviders(() => useSubmitTravelType(), {
      queryClient: qc,
    });
    await act(async () => {
      await result.current.mutateAsync([
        { questionId: 'q1', optionId: 'q1-a' },
        { questionId: 'q2', optionId: 'q2-b' },
      ]);
    });

    const cached = qc.getQueryData(rankingKeys.travelType());
    expect(cached).toEqual(mockTravelType);
  });
});

describe('useSetMyTravelType', () => {
  it('성공 시 travelType + mypage summary 양쪽 invalidate (setQueryData 안 함)', async () => {
    // BE spec: PATCH 응답은 ack only (recommended: []) — setQueryData 대신
    // invalidate → 다음 GET 이 recommended 포함 응답 반환.
    server.use(
      http.patch(`${apiUrl}/travel-types/me`, () =>
        HttpResponse.json({ ...mockTravelType, recommended: [] }),
      ),
    );
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');
    const setQueryDataSpy = vi.spyOn(qc, 'setQueryData');

    const { result } = renderHookWithProviders(() => useSetMyTravelType(), {
      queryClient: qc,
    });
    await act(async () => {
      await result.current.mutateAsync('explorer');
    });

    // travelType cache 에 직접 set 안 함 (recommended 가 빈 응답이라 — refetch 강제)
    expect(setQueryDataSpy).not.toHaveBeenCalledWith(
      rankingKeys.travelType(),
      expect.anything(),
    );
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: rankingKeys.travelType(),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['mypage', 'summary'],
    });
  });
});
