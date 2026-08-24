import { QueryClient } from '@tanstack/react-query';
import { act } from '@testing-library/react';
import { waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
  emoji: '🏛️',
  tags: ['#탐험'],
} as const;

describe('useMyTravelType — enabled: isAuthenticated 가드', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('비인증 시 fetch 0', () => {
    // 4-A 전환: 내 유형은 GET /me.travelType(code) 로 재구성.
    let called = 0;
    server.use(
      http.get(`${apiUrl}/me`, () => {
        called++;
        return HttpResponse.json({
          success: true,
          message: null,
          data: { travelType: mockTravelType.code },
        });
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
            tags: mockTravelType.tags,
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
    // 4-A 전환: PATCH /me { travelType } 로 저장 → invalidate 로 다음 GET 재조회.
    server.use(
      http.patch(`${apiUrl}/me`, () =>
        HttpResponse.json({
          success: true,
          message: null,
          data: { travelType: 'explorer' },
        }),
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
  // 추천/미지원 랭킹 타입(recommended 등)은 real-BE 모드(USE_MSW≠true)에서 dead
  // endpoint 를 skip(빈배열)한다. 이 블록은 mock 경로(구 generated /rankings) 어댑터
  // 매핑을 검증하므로 mock 모드로 고정.
  beforeEach(() => vi.stubEnv('NEXT_PUBLIC_USE_MSW', 'true'));
  afterEach(() => vi.unstubAllEnvs());

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

  it('useRanking — params 전달 + 응답 반환 (mock /rankings 경로)', async () => {
    // recommended 는 destinations/random 으로 전환되므로, /rankings 경로 검증은
    // 다른 타입(by-category)으로 확인.
    server.use(
      http.get(`${apiUrl}/rankings`, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('type')).toBe('by-category');
        expect(url.searchParams.get('limit')).toBe('5');
        return HttpResponse.json(mockRankItems);
      }),
    );
    const { result } = renderHookWithProviders(() =>
      useRanking({ type: 'by-category', limit: 5 }),
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

  it('useRecommendedDestinations — destinations/random 전환 + RankedDestination 매핑', async () => {
    let receivedSize: string | null = null;
    server.use(
      http.get(`${apiUrl}/destinations/random`, ({ request }) => {
        receivedSize = new URL(request.url).searchParams.get('size');
        return HttpResponse.json({
          success: true,
          message: null,
          data: [
            {
              id: 42,
              name: '랜덤여행지',
              category: 'attraction',
              region: 'cheongju',
              imageUrl: null,
            },
          ],
        });
      }),
    );
    const { result } = renderHookWithProviders(() =>
      useRecommendedDestinations(5),
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(receivedSize).toBe('5');
    expect(result.current.data?.[0]).toEqual({
      rank: 1,
      destination: {
        id: '42',
        name: '랜덤여행지',
        category: 'attraction',
        region: 'cheongju',
        imageUrl: undefined,
      },
      score: 0,
    });
  });
});

describe('useTravelTypeQuiz — 공개 엔드포인트 (BE whitelist 2026-08, 익명 200)', () => {
  const mockQuiz = {
    success: true,
    message: null,
    // 신규 Spring BE: ApiResponse<QuizDto>, id 는 number.
    data: {
      questions: [{ id: 1, text: 'Q1', options: [{ id: 1, text: 'A' }] }],
    },
  };

  it('비인증에도 fetch — 응답 반환 (id number → 도메인 string 정규화)', async () => {
    useAuthStore.getState().clearAuth();
    let called = 0;
    server.use(
      http.get(`${apiUrl}/travel-types/quiz`, () => {
        called++;
        return HttpResponse.json(mockQuiz);
      }),
    );
    const { result } = renderHookWithProviders(() => useTravelTypeQuiz());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(called).toBe(1);
    expect(result.current.data?.questions.length).toBe(1);
    expect(result.current.data?.questions[0]?.id).toBe('1');
  });

  it('인증 시에도 동일 동작', async () => {
    useAuthStore.getState().setAuth({
      id: 'u-1',
      username: 'tester',
      nickname: '여행자',
      email: 't@e.st',
      avatarUrl: null,
    });
    server.use(
      http.get(`${apiUrl}/travel-types/quiz`, () =>
        HttpResponse.json(mockQuiz),
      ),
    );
    const { result } = renderHookWithProviders(() => useTravelTypeQuiz());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.questions[0]?.id).toBe('1');
  });
});
