import { QueryClient } from '@tanstack/react-query';
import { act } from '@testing-library/react';
import { waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockSeeds } from '@/mocks/handlers';
import { server } from '@/mocks/server';
import { useAuthStore } from '@/stores/auth-store';
import { renderHookWithProviders } from '@/test-utils';
import {
  rankingKeys,
  useMyTravelType,
  useRanking,
  useRecommendedDestinations,
  useSetMyTravelType,
  useSubmitTravelType,
  useTravelTypeQuiz,
  useWeeklyTopDestinations,
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
    // 신규 Spring BE: thin TravelTypeResultDto(tags) 엔벨로프 → 어댑터가 도메인 TravelTypeDto 로 매핑.
    server.use(
      http.post(`${apiUrl}/travel-types/submit`, () =>
        HttpResponse.json({
          success: true,
          message: null,
          data: {
            code: mockTravelType.code,
            title: mockTravelType.title,
            emoji: mockTravelType.emoji,
            description: mockTravelType.description,
            tags: mockTravelType.keywords,
          },
        }),
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
        { questionId: '1', optionId: '1' },
        { questionId: '2', optionId: '6' },
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

describe('useRanking + alias hooks', () => {
  const mockRankItems = [
    {
      rank: 1,
      destination: {
        id: 'tour-1',
        name: 'A',
        category: 'attraction' as const,
        region: 'cheongju' as const,
      },
      score: 10,
    },
  ];

  it('useRanking — params 전달 + 응답 반환', async () => {
    server.use(
      http.get(`${apiUrl}/rankings`, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('type')).toBe('recommended');
        expect(url.searchParams.get('limit')).toBe('5');
        return HttpResponse.json(mockRankItems);
      }),
    );
    const { result } = renderHookWithProviders(() =>
      useRanking({ type: 'recommended', limit: 5 }),
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockRankItems);
  });

  it('useWeeklyTopDestinations — 신규 BE /tournaments/rankings/weekly (size 전달)', async () => {
    let receivedSize: string | null = null;
    server.use(
      http.get(`${apiUrl}/tournaments/rankings/weekly`, ({ request }) => {
        receivedSize = new URL(request.url).searchParams.get('size');
        return HttpResponse.json({
          success: true,
          message: null,
          data: {
            items: [{ destinationId: 7, destinationName: 'W', winCount: 12 }],
          },
        });
      }),
    );
    const { result } = renderHookWithProviders(() =>
      useWeeklyTopDestinations(3),
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(receivedSize).toBe('3');
    // 어댑터가 {destinationId,destinationName,winCount} → RankedDestination 매핑.
    expect(result.current.data?.[0]).toEqual({
      rank: 1,
      destination: { id: '7', name: 'W' },
      score: 12,
    });
  });

  it('useRecommendedDestinations — type=recommended 로 호출', async () => {
    let receivedType: string | null = null;
    server.use(
      http.get(`${apiUrl}/rankings`, ({ request }) => {
        receivedType = new URL(request.url).searchParams.get('type');
        return HttpResponse.json([]);
      }),
    );
    const { result } = renderHookWithProviders(() =>
      useRecommendedDestinations(),
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(receivedType).toBe('recommended');
  });
});

describe('useTravelTypeQuiz — public (auth 가드 없음)', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('비인증이라도 fetch — quiz 응답 반환 (신규 BE: id number → 도메인 string)', async () => {
    // 신규 Spring BE: ApiResponse<QuizDto>, id 는 number.
    const mockQuiz = {
      success: true,
      message: null,
      data: {
        questions: [
          {
            id: 1,
            text: 'Q1',
            options: [{ id: 1, text: 'A' }],
          },
        ],
      },
    };
    server.use(
      http.get(`${apiUrl}/travel-types/quiz`, () =>
        HttpResponse.json(mockQuiz),
      ),
    );
    const { result } = renderHookWithProviders(() => useTravelTypeQuiz());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.questions.length).toBe(1);
    // 어댑터가 number id 를 string 으로 정규화.
    expect(result.current.data?.questions[0]?.id).toBe('1');
  });
});
