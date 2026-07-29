import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import { mockSeeds } from '@/mocks/handlers';
import { server } from '@/mocks/server';
import { rankingApi } from './ranking';

/**
 * 랭킹 어댑터 매핑 단위 테스트 — 신규 Spring BE tournament rankings → RankedDestination.
 */
const apiUrl = mockSeeds.apiUrl;
const ok = (data: unknown) => ({ success: true, message: null, data });

describe('rankingApi.list — 신규 BE tournament rankings 매핑', () => {
  it('weekly-winners: items[{destinationId,destinationName,winCount}] → RankedDestination', async () => {
    server.use(
      http.get(`${apiUrl}/tournaments/rankings/weekly`, () =>
        HttpResponse.json(
          ok({
            year: 2026,
            month: 7,
            weekOfMonth: 3,
            items: [
              { destinationId: 42, destinationName: '월간우승', winCount: 9 },
            ],
          }),
        ),
      ),
    );

    const r = await rankingApi.list({ type: 'weekly-winners', limit: 5 });
    expect(r).toEqual([
      { rank: 1, destination: { id: '42', name: '월간우승' }, score: 9 },
    ]);
  });

  it('by-region: [{region,winCount}] → RankedDestination(destination.region, score)', async () => {
    server.use(
      http.get(`${apiUrl}/tournaments/rankings/regions`, () =>
        HttpResponse.json(
          ok([
            { region: 'cheongju', winCount: 12 },
            { region: 'danyang', winCount: 7 },
          ]),
        ),
      ),
    );

    const r = await rankingApi.list({ type: 'by-region' });
    expect(r).toHaveLength(2);
    expect(r[0]).toEqual({
      rank: 1,
      destination: { region: 'cheongju' },
      score: 12,
    });
    expect(r[1]).toEqual({
      rank: 2,
      destination: { region: 'danyang' },
      score: 7,
    });
  });
});

describe('rankingApi.getTravelTypeQuiz / submitTravelType — 신규 BE 매핑', () => {
  it('quiz: id number → string 정규화', async () => {
    server.use(
      http.get(`${apiUrl}/travel-types/quiz`, () =>
        HttpResponse.json(
          ok({
            questions: [{ id: 1, text: 'Q1', options: [{ id: 1, text: 'A' }] }],
          }),
        ),
      ),
    );

    const q = await rankingApi.getTravelTypeQuiz();
    expect(q.questions[0]?.id).toBe('1');
    expect(q.questions[0]?.options[0]?.id).toBe('1');
  });

  it('submit: answer string → number 전송 + thin 결과 tags → keywords 매핑', async () => {
    let sentBody: unknown;
    server.use(
      http.post(`${apiUrl}/travel-types/submit`, async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json(
          ok({
            code: 'explorer',
            title: '탐험형',
            emoji: '🧭',
            description: '설명',
            tags: ['#탐험', '#문화'],
          }),
        );
      }),
    );

    const res = await rankingApi.submitTravelType([
      { questionId: '1', optionId: '3' },
    ]);
    // 도메인 answer(string) → BE(number) 전송.
    expect(sentBody).toEqual({ answers: [{ questionId: 1, optionId: 3 }] });
    // thin 결과 → 도메인: tags → keywords, recommended → [].
    expect(res.code).toBe('explorer');
    expect(res.keywords).toEqual(['#탐험', '#문화']);
    expect(res.recommended).toEqual([]);
  });
});
