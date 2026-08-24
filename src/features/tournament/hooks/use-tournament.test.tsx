import { QueryClient } from '@tanstack/react-query';
import { act, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockSeeds } from '@/mocks/handlers';
import { server } from '@/mocks/server';
import { useAuthStore } from '@/stores/auth-store';
import { renderHookWithProviders } from '@/test-utils';
import type { SavedTournamentDto } from '@/types/api-domain';
import {
  tournamentKeys,
  useRecordTournament,
  useSaveTournament,
  useSavedTournaments,
  useTournamentHistory,
  useUnsaveTournament,
} from './use-tournament';

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
  it('성공 시 history invalidate (결과 딥링크 Spring 미지원 — record cache 없음)', async () => {
    const recordId = 4242;
    // 신규 Spring BE: POST /mypage/tournament-history → ApiResponse<TournamentSummaryDto>.
    server.use(
      http.post(`${apiUrl}/mypage/tournament-history`, () =>
        HttpResponse.json({
          success: true,
          message: null,
          data: {
            id: recordId,
            winnerName: '우승지',
            tournamentSize: 8,
            category: 'attraction',
            completedAt: '2026-06-19T00:00:00Z',
          },
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
        winnerName: '우승지',
      });
    });

    // 결과 딥링크 복원은 Spring 미지원 → record cache 미설정, 히스토리만 무효화.
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: tournamentKeys.history(),
    });
  });

  it('Idempotency-Key 헤더 전송 (BE dedup — 랭킹 이중 카운트 방지)', async () => {
    let capturedKey: string | null = null;
    server.use(
      http.post(`${apiUrl}/mypage/tournament-history`, ({ request }) => {
        capturedKey = request.headers.get('Idempotency-Key');
        return HttpResponse.json({
          success: true,
          message: null,
          data: {
            id: 5151,
            winnerName: '우승지',
            tournamentSize: 8,
            category: 'attraction',
            completedAt: '2026-06-19T00:00:00Z',
          },
        });
      }),
    );

    const { result } = renderHookWithProviders(() => useRecordTournament());
    await act(async () => {
      await result.current.mutateAsync({
        winnerId: 'd-1',
        runnerUpId: null,
        matchesPlayed: 3,
        tournamentSize: 8,
        winnerName: '우승지',
      });
    });

    // crypto.randomUUID() 가 happy-dom 에 존재 — UUID 형식 검증.
    expect(capturedKey).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });
});
