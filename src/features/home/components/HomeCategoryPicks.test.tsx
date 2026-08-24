import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockSeeds } from '@/mocks/handlers';
import { server } from '@/mocks/server';
import { renderWithProviders } from '@/test-utils';
import { HomeCategoryPicks } from './HomeCategoryPicks';

const apiUrl = mockSeeds.apiUrl;

function stubSources(opts: {
  festivals?: Record<string, unknown>;
  recommended?: unknown[];
}) {
  server.use(
    http.get(`${apiUrl}/regions/ongoing-festivals`, () =>
      // 신규 Spring: ApiResponse<OngoingFestivalsDto> 엔벨로프 (어댑터가 .data 언랩).
      HttpResponse.json({
        success: true,
        message: null,
        data: opts.festivals ?? { type: 'ongoing', items: [] },
      }),
    ),
    // 추천은 destinations/random 으로 전환 — RankedDestination[] 의 destination 만 반환.
    http.get(`${apiUrl}/destinations/random`, () =>
      HttpResponse.json({
        success: true,
        message: null,
        data: (opts.recommended ?? []).map(
          (r) => (r as { destination: unknown }).destination,
        ),
      }),
    ),
  );
}

const festival = (overrides?: Record<string, unknown>) => ({
  id: 'tour-1',
  name: '청주 축제',
  imageUrl: null,
  regionLabel: 'cheongju',
  daysToStart: 7,
  ...overrides,
});

const ranked = (overrides?: Record<string, unknown>) => ({
  rank: 0,
  score: 0,
  destination: {
    id: 'tour-2',
    name: '도담삼봉',
    category: 'attraction',
    region: 'danyang',
    imageUrl: null,
    ...((overrides?.destination as Record<string, unknown>) ?? {}),
  },
});

describe('HomeCategoryPicks — Figma rec-block (칩 필터 + 추천/축제 병합)', () => {
  // 추천(useRecommendedDestinations)은 destinations/random 으로 전환 — stubSources 가
  // /destinations/random 을 주입. USE_MSW 고정(축제 병합 소스 등 mock 경로 검증).
  beforeEach(() => vi.stubEnv('NEXT_PUBLIC_USE_MSW', 'true'));
  afterEach(() => vi.unstubAllEnvs());

  it('두 소스가 모두 비면 섹션 자체 미노출 (null 렌더)', async () => {
    stubSources({ festivals: { type: 'ongoing', items: [] }, recommended: [] });

    const { container } = renderWithProviders(<HomeCategoryPicks />);
    await waitFor(() => {
      expect(
        container.querySelector('[data-widget="category-picks"]'),
      ).toBeNull();
    });
  });

  it('한쪽만 있어도 섹션 헤더 + 칩 4개 노출', async () => {
    stubSources({
      festivals: { type: 'upcoming', items: [festival()] },
      recommended: [],
    });

    const { findByText, getByRole } = renderWithProviders(
      <HomeCategoryPicks />,
    );
    expect(await findByText('이런 여행 어때요?')).toBeInTheDocument();
    expect(await findByText('카테고리별 추천 여행지')).toBeInTheDocument();
    // 칩 4개 — 전체 / 관광지 / 축제 / 체험관광
    const tabs = getByRole('tablist', { name: '카테고리 선택' });
    expect(tabs.querySelectorAll('[role="tab"]')).toHaveLength(4);
  });

  it('칩 선택 시 해당 카테고리만 남는다 (없으면 빈 안내)', async () => {
    // 축제만 있는 상태에서 "체험관광" 칩을 고르면 비어야 한다.
    stubSources({
      festivals: { type: 'ongoing', items: [festival()] },
      recommended: [],
    });

    const { findByRole, findByText } = renderWithProviders(
      <HomeCategoryPicks />,
    );
    const experienceChip = await findByRole('tab', { name: '체험관광' });
    await userEvent.click(experienceChip);
    expect(
      await findByText('추천 여행지를 준비하고 있어요'),
    ).toBeInTheDocument();
  });

  it('추천 응답만 있어도 렌더된다 (축제 엔드포인트 빈 응답)', async () => {
    stubSources({
      festivals: { type: 'ongoing', items: [] },
      recommended: [ranked()],
    });

    const { findByText, container } = renderWithProviders(
      <HomeCategoryPicks />,
    );
    expect(await findByText('이런 여행 어때요?')).toBeInTheDocument();
    expect(
      container.querySelector('[data-widget="category-picks"]'),
    ).toBeInTheDocument();
  });
});
