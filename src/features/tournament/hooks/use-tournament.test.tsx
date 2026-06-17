import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { mockSeeds } from '@/mocks/handlers';
import { renderHookWithProviders } from '@/test-utils';
import { useAuthStore } from '@/stores/auth-store';
import {
  tournamentKeys,
  useRecordTournament,
  useSaveTournament,
  useSavedTournaments,
  useTournamentHistory,
  useUnsaveTournament,
} from './use-tournament';
import type { SavedTournamentDto } from '@/api/generated/schemas';

const apiUrl = mockSeeds.apiUrl;

function makeSaved(id: string): SavedTournamentDto {
  return {
    id,
    destination: {
      id: `d-${id}`,
      name: `여행지${id}`,
      region: 'cheongju',
      category: 'attraction',
    },
    savedAt: '2026-06-14T00:00:00Z',
    luckyColor: '#FBBF24',
  };
}

describe('useSavedTournaments / useTournamentHistory — enabled: isAuthenticated 가드', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('useSavedTournaments — 비인증 시 fetch 0', () => {
    let called = 0;
    server.use(
      http.get(`${apiUrl}/mypage/tournaments`, () => {
        called++;
        return HttpResponse.json([]);
      }),
    );
    const { result } = renderHookWithProviders(() => useSavedTournaments());
    expect(result.current.fetchStatus).toBe('idle');
    expect(called).toBe(0);
  });

  it('useTournamentHistory — 비인증 시 fetch 0', () => {
    let called = 0;
    server.use(
      http.get(`${apiUrl}/mypage/tournament-history`, () => {
        called++;
        return HttpResponse.json({ items: [], nextCursor: null });
      }),
    );
    const { result } = renderHookWithProviders(() => useTournamentHistory());
    expect(result.current.fetchStatus).toBe('idle');
    expect(called).toBe(0);
  });
});

describe('useSaveTournament', () => {
  it('성공 시 saved list invalidate', async () => {
    server.use(
      http.post(`${apiUrl}/mypage/tournaments`, () =>
        HttpResponse.json(makeSaved('s-new')),
      ),
    );
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');

    const { result } = renderHookWithProviders(() => useSaveTournament(), {
      queryClient: qc,
    });
    // useSaveTournament 은 winnerId (string) 만 받음 — mypage saveToMypage 매핑.
    await act(async () => {
      await result.current.mutateAsync('d-1');
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: tournamentKeys.saved(),
    });
  });
});

describe('useUnsaveTournament — optimistic remove + rollback', () => {
  it('onMutate 즉시 cache 에서 해당 id 제거', async () => {
    server.use(
      http.delete(
        `${apiUrl}/mypage/tournaments/:savedId`,
        () => new HttpResponse(null, { status: 204 }),
      ),
    );
    // gcTime 길게 — invalidate 후 inactive 라도 cache 유지되어 검증 가능.
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 60_000 } },
    });
    qc.setQueryData<SavedTournamentDto[]>(tournamentKeys.saved(), [
      makeSaved('a'),
      makeSaved('b'),
      makeSaved('c'),
    ]);

    const { result } = renderHookWithProviders(() => useUnsaveTournament(), {
      queryClient: qc,
    });
    await act(async () => {
      await result.current.mutateAsync('b');
    });

    const cached = qc.getQueryData<SavedTournamentDto[]>(
      tournamentKeys.saved(),
    );
    // optimistic remove → 'b' 사라짐 (final 은 server 응답 후 invalidate 결과)
    expect(cached).toBeDefined();
    expect(cached?.map((s) => s.id)).not.toContain('b');
  });

  it('서버 실패 시 snapshot 으로 롤백', async () => {
    server.use(
      http.delete(
        `${apiUrl}/mypage/tournaments/:savedId`,
        () => new HttpResponse(null, { status: 500 }),
      ),
    );
    const qc = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 60_000 },
        mutations: { retry: false },
      },
    });
    const original = [makeSaved('a'), makeSaved('b'), makeSaved('c')];
    qc.setQueryData<SavedTournamentDto[]>(tournamentKeys.saved(), original);

    const { result } = renderHookWithProviders(() => useUnsaveTournament(), {
      queryClient: qc,
    });
    await act(async () => {
      try {
        await result.current.mutateAsync('b');
      } catch {
        // expected 500
      }
    });

    await waitFor(() => {
      const cached = qc.getQueryData<SavedTournamentDto[]>(
        tournamentKeys.saved(),
      );
      // 롤백 — 원본 그대로 (3 개)
      expect(cached?.map((s) => s.id)).toEqual(['a', 'b', 'c']);
    });
  });
});

describe('useRecordTournament', () => {
  it('성공 시 record cache set + history invalidate', async () => {
    const recordId = 'rec-1';
    server.use(
      http.post(`${apiUrl}/tournaments`, () =>
        HttpResponse.json({
          id: recordId,
          winner: { id: 'd-1', name: '우승지', region: 'cheongju' },
          runnerUp: null,
          matchesPlayed: 3,
        }),
      ),
    );
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');

    const { result } = renderHookWithProviders(() => useRecordTournament(), {
      queryClient: qc,
    });
    await act(async () => {
      await result.current.mutateAsync({
        winnerId: 'd-1',
        runnerUpId: null,
        matchesPlayed: 3,
        tournamentSize: 8,
      });
    });

    // record cache 에 직접 set (refetch 없이 deep-link 진입 즉시 사용)
    const cached = qc.getQueryData(tournamentKeys.record(recordId));
    expect(cached).toBeDefined();
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: tournamentKeys.history(),
    });
  });
});
