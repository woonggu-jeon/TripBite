import { describe, it, expect } from 'vitest';
import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { mockSeeds } from '@/mocks/handlers';
import { renderWithProviders } from '@/test-utils';
import { FestivalCarousel } from './FestivalCarousel';

const apiUrl = mockSeeds.apiUrl;

function stubResponse(body: Record<string, unknown>) {
  server.use(
    http.get(`${apiUrl}/regions/ongoing-festivals`, () =>
      HttpResponse.json(body),
    ),
  );
}

const sampleItem = (overrides?: Partial<Record<string, unknown>>) => ({
  id: 'tour-1',
  name: '청주 축제',
  imageUrl: null,
  regionLabel: 'cheongju',
  daysToStart: 7,
  ...overrides,
});

describe('FestivalCarousel — 3단계 폴백 응답 분기', () => {
  it('type=ongoing → "지금 열리는 축제" 섹션 타이틀 + D-day 뱃지 미노출', async () => {
    stubResponse({
      type: 'ongoing',
      items: [sampleItem({ daysToStart: undefined })],
    });

    const { getByText, queryByText } = renderWithProviders(
      <FestivalCarousel />,
    );
    await waitFor(() => {
      expect(getByText('지금 열리는 축제')).toBeInTheDocument();
    });
    // D-day 뱃지는 ongoing 일 땐 노출 X
    expect(queryByText(/^D-\d+$/)).toBeNull();
  });

  it('type=upcoming → "곧 열리는 축제" 섹션 타이틀 + data-type=upcoming', async () => {
    stubResponse({
      type: 'upcoming',
      items: [sampleItem({ daysToStart: 12 })],
    });

    const { findByText, container } = renderWithProviders(<FestivalCarousel />);
    expect(await findByText('곧 충북에서 열리는 축제')).toBeInTheDocument();
    // D-day 뱃지 자체 렌더링은 DdayBadge.test 가 단독 검증. Carousel 안의 slide 는
    // jsdom 에서 embla measurement 미작동으로 mount 되지 않음 — section 메타로 검증.
    expect(
      container.querySelector('[data-type="upcoming"]'),
    ).toBeInTheDocument();
  });

  it('type=popular → "이번 주 인기 여행지" 섹션 타이틀', async () => {
    stubResponse({
      type: 'popular',
      items: [sampleItem({ daysToStart: undefined })],
    });

    const { findByText, queryByText } = renderWithProviders(
      <FestivalCarousel />,
    );
    expect(await findByText('이번 주 인기 여행지')).toBeInTheDocument();
    expect(queryByText(/^D-\d+$/)).toBeNull();
  });

  it('items 빈 응답 → section 자체 미노출 (null 렌더)', async () => {
    stubResponse({ type: 'ongoing', items: [] });

    const { container } = renderWithProviders(<FestivalCarousel />);
    await waitFor(() => {
      expect(
        container.querySelector('[data-widget="ongoing-festivals"]'),
      ).toBeNull();
    });
  });
});
