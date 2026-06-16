import { describe, it, expect } from 'vitest';
import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { mockSeeds } from '@/mocks/handlers';
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
  it('region 인자 없이 호출 시 전체 축제 fetch', async () => {
    server.use(
      http.get(`${apiUrl}/regions/ongoing-festivals`, ({ request }) => {
        const url = new URL(request.url);
        // region 미지정 시 query param 없음
        expect(url.searchParams.has('region')).toBe(false);
        return HttpResponse.json({
          type: 'ongoing',
          items: [
            {
              id: 'f-1',
              title: '진행 중 축제',
              imageUrl: 'https://cdn.example.com/f.jpg',
            },
          ],
        });
      }),
    );

    const { result } = renderHookWithProviders(() => useOngoingFestivals());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.type).toBe('ongoing');
    expect(result.current.data?.items.length).toBe(1);
  });

  it('region 지정 시 query string 포함', async () => {
    server.use(
      http.get(`${apiUrl}/regions/ongoing-festivals`, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('region')).toBe('danyang');
        return HttpResponse.json({ type: 'upcoming', items: [] });
      }),
    );

    const { result } = renderHookWithProviders(() =>
      useOngoingFestivals('danyang'),
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.type).toBe('upcoming');
  });
});
