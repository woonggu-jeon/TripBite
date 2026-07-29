import { waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import { mockSeeds } from '@/mocks/handlers';
import { server } from '@/mocks/server';
import { renderHookWithProviders } from '@/test-utils';
import {
  useOngoingFestivals,
  useRegionContents,
  useRegionSummary,
} from './use-region';

const apiUrl = mockSeeds.apiUrl;

describe('useRegionSummary', () => {
  it('성공 시 summary 응답 반환', async () => {
    const summary = {
      code: 'cheongju',
      ko: '청주시',
      en: 'Cheongju',
      description: '충북의 중심',
      heroImage: 'https://cdn.example.com/cheongju.jpg',
    };
    server.use(
      http.get(`${apiUrl}/regions/cheongju/summary`, () =>
        HttpResponse.json(summary),
      ),
    );

    const { result } = renderHookWithProviders(() =>
      useRegionSummary('cheongju'),
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(summary);
  });
});

describe('useRegionContents — useInfiniteList wrapping', () => {
  it('첫 페이지 fetch — items 플랫튼 + http→https 정규화', async () => {
    server.use(
      http.get(`${apiUrl}/regions/cheongju/contents`, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('type')).toBe('attraction');
        expect(url.searchParams.get('limit')).toBe('10');
        return HttpResponse.json({
          items: [
            {
              id: 'c-1',
              title: '명승지',
              imageUrl: 'http://tong.visitkorea.or.kr/p.jpg',
              category: 'attraction',
            },
          ],
          nextCursor: null,
        });
      }),
    );

    const { result } = renderHookWithProviders(() =>
      useRegionContents('cheongju', 'attraction'),
    );
    await waitFor(() => expect(result.current.items.length).toBe(1));
    expect(result.current.hasNext).toBe(false);
    // BE 안전망: http → https 정규화 검증
    expect(result.current.items[0]).toMatchObject({
      id: 'c-1',
      imageUrl: 'https://tong.visitkorea.or.kr/p.jpg',
    });
  });
});

describe('useOngoingFestivals', () => {
  it('전체 축제 fetch (신규 Spring BE: ApiResponse 엔벨로프)', async () => {
    server.use(
      http.get(`${apiUrl}/regions/ongoing-festivals`, () =>
        HttpResponse.json({
          success: true,
          message: null,
          data: {
            type: 'ongoing',
            items: [
              {
                id: 1,
                name: '진행 중 축제',
                imageUrl: 'https://cdn.example.com/f.jpg',
              },
            ],
          },
        }),
      ),
    );

    const { result } = renderHookWithProviders(() => useOngoingFestivals());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.type).toBe('ongoing');
    expect(result.current.data?.items.length).toBe(1);
  });

  it('region 인자 전달돼도 새 BE 는 region query 미전송 (전체 반환)', async () => {
    server.use(
      http.get(`${apiUrl}/regions/ongoing-festivals`, ({ request }) => {
        const url = new URL(request.url);
        // 신규 BE 엔드포인트는 region 파라미터를 받지 않음.
        expect(url.searchParams.has('region')).toBe(false);
        return HttpResponse.json({
          success: true,
          message: null,
          data: { type: 'upcoming', items: [] },
        });
      }),
    );

    const { result } = renderHookWithProviders(() =>
      useOngoingFestivals('danyang'),
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.type).toBe('upcoming');
  });
});
