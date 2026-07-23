import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { mockSeeds } from '@/mocks/handlers';
import { tournamentApi } from './tournament';
import type { TournamentConfig } from '@/features/tournament/types';

/**
 * 어댑터 매핑 단위 테스트 — 신규 Spring BE(ApiResponse 엔벨로프) → 도메인 shape 매핑 검증.
 * 실 BE 실측 응답 shape 기준으로 mock 을 구성해 필드 단위로 pin.
 */
const apiUrl = mockSeeds.apiUrl;
const ok = (data: unknown) => ({ success: true, message: null, data });

describe('tournamentApi.getDestinationDetail — 신규 BE(정수 id) 매핑', () => {
  it('images → photos, id number → string 매핑', async () => {
    server.use(
      http.get(`${apiUrl}/destinations/2987654`, () =>
        HttpResponse.json(
          ok({
            id: 2987654,
            name: '건지마을',
            category: 'experience',
            region: 'chungju',
            imageUrl: 'https://cdn.test/main.jpg',
            images: ['https://cdn.test/p1.jpg', 'https://cdn.test/p2.jpg'],
            address: '충북 충주',
            type: '체험',
            admissionFee: null,
            description: '설명',
            tags: ['#a'],
            eventStart: null,
            eventEnd: null,
          }),
        ),
      ),
    );

    const d = await tournamentApi.getDestinationDetail('2987654');
    expect(d.id).toBe('2987654');
    expect(d.name).toBe('건지마을');
    // 신규 BE 의 images 를 도메인 photos 로 매핑.
    expect(d.photos).toEqual([
      'https://cdn.test/p1.jpg',
      'https://cdn.test/p2.jpg',
    ]);
    expect(d.description).toBe('설명');
  });
});

describe('tournamentApi.fetchCandidates — 신규 BE random 매핑', () => {
  it('data 배열 → DestinationDto[] (id number → string)', async () => {
    server.use(
      http.get(`${apiUrl}/destinations/random`, ({ request }) => {
        const url = new URL(request.url);
        // 단일 category/region + size 전달 확인.
        expect(url.searchParams.get('season')).toBe('spring');
        expect(url.searchParams.get('category')).toBe('festival');
        expect(url.searchParams.get('region')).toBe('danyang');
        expect(url.searchParams.get('size')).toBe('8');
        return HttpResponse.json(
          ok([
            {
              id: 111,
              name: '축제A',
              category: 'festival',
              region: 'danyang',
              imageUrl: null,
            },
          ]),
        );
      }),
    );

    const config = {
      theme: { kind: 'season', value: 'spring' },
      categories: ['festival'],
      selectedRegions: ['danyang'],
      tournamentSize: 8,
    } as unknown as TournamentConfig;

    const c = await tournamentApi.fetchCandidates(config);
    expect(c).toHaveLength(1);
    expect(c[0]?.id).toBe('111');
    expect(c[0]?.name).toBe('축제A');
    expect(c[0]?.region).toBe('danyang');
  });
});

describe('tournamentApi.listSaved — 신규 BE 저장목록 매핑', () => {
  it('엔벨로프 → SavedTournamentDto[] (id string, luckyColor "")', async () => {
    server.use(
      http.get(`${apiUrl}/mypage/tournaments`, () =>
        HttpResponse.json(
          ok([
            {
              id: 1,
              destination: {
                id: 2987654,
                name: '건지마을',
                category: 'experience',
                region: 'chungju',
                address: '충북 충주',
                imageUrl: 'https://cdn.test/d.jpg',
              },
              savedAt: '2026-07-23T00:00:00Z',
            },
          ]),
        ),
      ),
    );

    const s = await tournamentApi.listSaved();
    expect(s).toHaveLength(1);
    expect(s[0]?.id).toBe('1');
    expect(s[0]?.destination.id).toBe('2987654');
    expect(s[0]?.savedAt).toBe('2026-07-23T00:00:00Z');
    // 신규 BE 는 luckyColor 미제공 → '' 로 매핑.
    expect(s[0]?.luckyColor).toBe('');
  });
});

describe('tournamentApi.listHistory — 신규 BE 기록 매핑', () => {
  it('flat TournamentSummaryDto[] → {items,nextCursor} (count ← tournamentSize)', async () => {
    server.use(
      http.get(`${apiUrl}/mypage/tournament-history`, () =>
        HttpResponse.json(
          ok([
            {
              id: 5,
              winnerName: '우승지',
              tournamentSize: 16,
              category: 'attraction',
              completedAt: '2026-07-23T00:00:00Z',
            },
          ]),
        ),
      ),
    );

    const h = await tournamentApi.listHistory();
    expect(h.nextCursor).toBeNull();
    expect(h.items).toHaveLength(1);
    expect(h.items[0]?.id).toBe('5');
    expect(h.items[0]?.winnerName).toBe('우승지');
    // 신규 BE tournamentSize → 도메인 count.
    expect(h.items[0]?.count).toBe(16);
    expect(h.items[0]?.category).toBe('attraction');
  });
});
