/**
 * MSW REST 핸들러 — dev + vitest + playwright 공유
 *
 * 동작:
 *   dev:    src/mocks/browser.ts 의 setupWorker 가 service worker 로 가로챔
 *   vitest: src/mocks/server.ts 의 setupServer 가 node 환경에서 가로챔
 *   e2e:    playwright globalSetup 에서 동일 server 사용 가능
 *
 * 활성화 토글 (dev):
 *   .env.local 에 NEXT_PUBLIC_USE_MSW=true 추가
 *   providers.tsx 가 동적 import 로 worker.start() 호출
 *
 * 주의:
 *   service worker 는 same-origin scope 만 가로챔.
 *   백엔드 호출이 cross-origin (`NEXT_PUBLIC_API_URL`이 다른 호스트) 이면
 *   axios baseURL 을 same-origin proxy 로 두거나, Next rewrites 로 우회 필요.
 *   테스트 (vitest/node) 에선 origin 제약 없이 모두 가로챔.
 */

import { http, HttpResponse } from 'msw';
import { regionContentSeeds } from './seeds/regions';
import { letterSeeds } from './seeds/letters';
import { tournamentHistorySeeds } from './seeds/tournament';
import { destinationSeeds } from './seeds/destinations';
import { notificationSeeds } from './seeds/notifications';
import {
  travelTypeMetaSeed,
  travelTypeMockScoreMap,
  travelTypeQuizSeed,
  travelTypeRecommendCategoriesSeed,
  type TravelTypeMockCode,
} from './seeds/travel-types';
import type { TravelType, TravelTypeAnswer } from '@/features/ranking/types';
import type { AppNotification } from '@/features/notification/types';

/**
 * URL 매칭 base.
 * MSW 모드에서 axios baseURL이 '/api/backend'로 바뀌므로 (services/api/client.ts)
 * handler URL도 same-origin path prefix를 사용해야 매칭됨.
 * MSW 미사용 시(예: 테스트 외 production)는 NEXT_PUBLIC_API_URL 그대로.
 */
const apiUrl =
  process.env.NEXT_PUBLIC_USE_MSW === 'true'
    ? '/api/backend'
    : (process.env.NEXT_PUBLIC_API_URL ?? '');

export const mockSeeds = {
  regions: regionContentSeeds,
  letters: letterSeeds,
  tournaments: tournamentHistorySeeds,
  notifications: notificationSeeds,
  apiUrl,
};

const mockUser = {
  id: '1',
  nickname: '테스터',
  email: 't@e.com',
  homeRegion: 'cheongju',
} as const;

/**
 * 온보딩 완료 상태 — 신규 가입 흐름 재현용 mutable 상태.
 *   - 초기 false → /me가 isOnboarded:false → AuthBootstrap이 /onboarding 유지
 *   - complete-onboarding 호출 시 true → 이후 /me가 true → 홈 진입
 * dev 서버(서비스워커) 재시작 시 false로 리셋.
 */
let onboardedState = false;

/**
 * 여행 유형 테스트 — 사용자의 저장된 결과(mutable). submit 시 갱신.
 * dev 서버 재시작 시 null 로 리셋.
 */
let myTravelType: TravelType | null = null;

/**
 * 알림 인박스 (mutable) — seed 복사. push 시뮬레이션 / markRead 가 mutate.
 * dev 서버 재시작 시 seed 로 reset.
 *
 * seed 는 type / read / createdAt 만 가지지만 AppNotification 은 title 필수
 * (그 외 body/link 는 옵션). title/body 는 type 에서 derive 해 채워둠.
 */
const TITLE_BY_TYPE: Record<string, string> = {
  'letter.received': '새 편지가 도착했어요',
  'letter.liked': '내 편지에 좋아요',
  event: '새 소식',
  'tournament.shared': '토너먼트 공유',
};
const notificationItems: AppNotification[] = notificationSeeds.map((n) => ({
  id: n.id,
  type: n.type as AppNotification['type'],
  title: TITLE_BY_TYPE[n.type] ?? '알림',
  read: n.read,
  createdAt: n.createdAt,
}));

/** 셔플 후 N 개 — Fisher–Yates 부분 */
function pickRandom<T>(arr: readonly T[], n: number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const ai = a[i];
    const aj = a[j];
    if (ai !== undefined && aj !== undefined) {
      a[i] = aj;
      a[j] = ai;
    }
  }
  return a.slice(0, Math.min(n, a.length));
}

/**
 * mock 측 점수 계산 — answers 의 optionId 마다 매핑된 유형에 +1, 최고점 유형 반환.
 * 동점 시 첫 등장 유형 우선 (Map 순서).
 */
function resolveTravelType(answers: TravelTypeAnswer[]): TravelType {
  const score: Record<TravelTypeMockCode, number> = {
    adventurer: 0,
    explorer: 0,
    relaxer: 0,
    foodie: 0,
  };
  answers.forEach((a) => {
    const code = travelTypeMockScoreMap[a.optionId];
    if (code) score[code] += 1;
  });
  let best: TravelTypeMockCode = 'adventurer';
  let bestScore = -1;
  (Object.keys(score) as TravelTypeMockCode[]).forEach((k) => {
    if (score[k] > bestScore) {
      bestScore = score[k];
      best = k;
    }
  });
  const meta = travelTypeMetaSeed[best];
  const cats = travelTypeRecommendCategoriesSeed[best];
  const pool = destinationSeeds.filter((d) =>
    cats.includes(d.category as (typeof cats)[number]),
  );
  return { ...meta, recommended: pickRandom(pool, 3) };
}

// dev mock — 단일 좌표라도 사용자에게 다양해 보이도록 좌표 hash 기반 11시군 매핑.
// 좌표가 같으면 같은 시군 반환(deterministic). 실제 backend 는 정확한 reverse geocoding.
const MOCK_REGIONS = [
  { label: '충북 청주시', regionCode: 'cheongju' },
  { label: '충북 충주시', regionCode: 'chungju' },
  { label: '충북 제천시', regionCode: 'jecheon' },
  { label: '충북 단양군', regionCode: 'danyang' },
  { label: '충북 보은군', regionCode: 'boeun' },
  { label: '충북 옥천군', regionCode: 'okcheon' },
  { label: '충북 영동군', regionCode: 'yeongdong' },
  { label: '충북 진천군', regionCode: 'jincheon' },
  { label: '충북 괴산군', regionCode: 'goesan' },
  { label: '충북 음성군', regionCode: 'eumseong' },
  { label: '충북 증평군', regionCode: 'jeungpyeong' },
];

function mockRegionFromCoords(latitude: number, longitude: number) {
  // 0.0001 단위까지 반영 → 같은 위치에서 항상 같은 결과
  const seed =
    Math.abs(Math.round(latitude * 10000) + Math.round(longitude * 10000)) >>>
    0;
  return MOCK_REGIONS[seed % MOCK_REGIONS.length] ?? MOCK_REGIONS[0]!;
}

const mockResolvedLocation = {
  latitude: 36.6424,
  longitude: 127.489,
  ...mockRegionFromCoords(36.6424, 127.489),
};

const mockWeather = {
  temperature: 18,
  feelsLike: 17,
  condition: 'clear' as const,
  summary: '맑음, 외출하기 좋아요',
  humidity: 55,
  locationLabel: '충북 청주시',
};

export const handlers = [
  // ===== Auth =====
  http.post(`${apiUrl}/auth/login`, () => HttpResponse.json({ success: true })),
  http.post(
    `${apiUrl}/auth/signup`,
    () => new HttpResponse(null, { status: 201 }),
  ),
  http.post(
    `${apiUrl}/auth/forgot-password`,
    () => new HttpResponse(null, { status: 204 }),
  ),
  http.post(
    `${apiUrl}/auth/reset-password`,
    () => new HttpResponse(null, { status: 204 }),
  ),
  // 아이디 찾기 — 마스킹된 아이디 반환 (메일 발송 X)
  http.post(`${apiUrl}/auth/find-id`, () =>
    HttpResponse.json({ username: 'tes***01' }),
  ),
  // 비밀번호 변경 (로그인 상태)
  http.post(
    `${apiUrl}/me/change-password`,
    () => new HttpResponse(null, { status: 204 }),
  ),
  http.post(
    `${apiUrl}/auth/logout`,
    () => new HttpResponse(null, { status: 204 }),
  ),
  http.post(
    `${apiUrl}/auth/refresh`,
    () => new HttpResponse(null, { status: 204 }),
  ),
  http.get(`${apiUrl}/me`, () =>
    HttpResponse.json({ ...mockUser, isOnboarded: onboardedState }),
  ),

  // ===== Onboarding =====
  http.post(`${apiUrl}/me/complete-onboarding`, async ({ request }) => {
    const body = (await request.json()) as { nickname?: string };
    onboardedState = true;
    return HttpResponse.json({
      ...mockUser,
      nickname: body.nickname ?? mockUser.nickname,
      isOnboarded: true,
    });
  }),

  // ===== Location =====
  // 좌표 → 라벨 (reverse geocode) — 좌표 hash 기반 11시군 분산
  http.post(`${apiUrl}/location/reverse`, async ({ request }) => {
    const coords = (await request.json()) as {
      latitude: number;
      longitude: number;
    };
    const region = mockRegionFromCoords(coords.latitude, coords.longitude);
    return HttpResponse.json({
      ...coords,
      label: region.label,
      regionCode: region.regionCode,
    });
  }),
  // IP 기반 대략적 위치
  http.get(`${apiUrl}/location/ip`, () =>
    HttpResponse.json(mockResolvedLocation),
  ),

  // ===== Weather =====
  http.get(`${apiUrl}/weather/current`, () => HttpResponse.json(mockWeather)),

  // ===== Letters =====
  http.post(`${apiUrl}/letters`, () => new HttpResponse(null, { status: 201 })),
  // 편지 목록 — 모두 cursor 기반 페이지네이션 통일
  ...['received', 'sent', 'liked', 'saved'].map((kind) =>
    http.get(`${apiUrl}/letters/${kind}`, ({ request }) => {
      const url = new URL(request.url);
      const cursor = Number(url.searchParams.get('cursor') ?? 0);
      const limit = Number(url.searchParams.get('limit') ?? 10);
      let pool = letterSeeds;
      if (kind === 'sent') pool = letterSeeds.filter((l) => l.isMine);
      else if (kind === 'received') pool = letterSeeds.filter((l) => !l.isMine);
      else if (kind === 'liked') pool = letterSeeds.filter((l) => l.liked);
      else if (kind === 'saved') pool = letterSeeds.filter((l) => l.saved);
      const slice = pool.slice(cursor, cursor + limit);
      const nextCursor = cursor + limit < pool.length ? cursor + limit : null;
      return HttpResponse.json({ items: slice, nextCursor });
    }),
  ),
  http.get(`${apiUrl}/letters/:id`, ({ params }) => {
    const seed = letterSeeds.find((l) => l.id === params.id);
    if (!seed) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(seed);
  }),
  http.delete(
    `${apiUrl}/letters/:id`,
    () => new HttpResponse(null, { status: 204 }),
  ),
  http.post(`${apiUrl}/letters/:id/like`, ({ params }) => {
    const seed = letterSeeds.find((l) => l.id === params.id);
    if (!seed) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ ...seed, liked: !seed.liked });
  }),
  http.post(`${apiUrl}/letters/:id/save`, ({ params }) => {
    const seed = letterSeeds.find((l) => l.id === params.id);
    if (!seed) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ ...seed, saved: !seed.saved });
  }),

  // ===== Region =====
  http.get(`${apiUrl}/regions/:code/contents`, ({ params, request }) => {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const items = regionContentSeeds.filter(
      (r) => r.region === params.code && r.type === type,
    );
    return HttpResponse.json({ items, nextCursor: null });
  }),

  // ===== Rankings =====
  http.get(`${apiUrl}/rankings`, ({ request }) => {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const limit = Number(url.searchParams.get('limit') ?? 5);

    if (type === 'weekly-winners') {
      // 우승 횟수 desc 시뮬레이션 — destinationSeeds 앞 N개
      const top = destinationSeeds
        .slice(0, Math.min(limit, 10))
        .map((d, i) => ({
          rank: i + 1,
          destination: d,
          score: 28 - i * 3, // 28, 25, 22 ...
        }));
      return HttpResponse.json(top);
    }

    if (type === 'by-region') {
      // 11 시군별 누적 우승 횟수 — deterministic 가짜 데이터 (시드 기반)
      const ranks = MOCK_REGIONS.map((r, i) => ({
        rank: i + 1,
        destination: {
          id: `region-${r.regionCode}`,
          name: r.label.replace('충북 ', ''),
          category: 'attraction' as const,
          region: r.regionCode,
        },
        score: 48 - i * 3 + ((i * 7) % 5), // 48..15 살짝 흩어짐
      }))
        .sort((a, b) => b.score - a.score)
        .map((r, i) => ({ ...r, rank: i + 1 }));
      return HttpResponse.json(ranks);
    }

    return HttpResponse.json([]);
  }),

  // ===== Tournament =====
  http.get(`${apiUrl}/mypage/tournament-history`, () =>
    HttpResponse.json({ items: tournamentHistorySeeds, nextCursor: null }),
  ),
  // 우승 여행지를 마이페이지에 저장
  http.post(`${apiUrl}/mypage/tournaments`, async ({ request }) => {
    const body = (await request.json()) as { destinationId: string };
    const dest = destinationSeeds.find((d) => d.id === body.destinationId);
    if (!dest) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({
      id: `saved-${body.destinationId}`,
      destination: dest,
      luckyColor: '#7AC7E8',
      meetChance: 75,
      savedAt: new Date().toISOString(),
    });
  }),
  // 조건에 맞는 후보 여행지 풀 반환 — 셔플 후 잘라서 반환
  //   - count: 여행지 갯수 (N)
  //   - tournamentSize: 매치업 사이즈 (M ≤ N) — 현재 mock 은 무시, 백엔드 연동 후 활용
  //   - pool : 클라이언트에 노출할 풀 사이즈 (없으면 count와 같음)
  //
  // ⚠ 반드시 `/destinations/:id` 보다 먼저 등록 — :id 가 'random' 도 매칭하므로.
  http.get(`${apiUrl}/destinations/random`, ({ request }) => {
    const url = new URL(request.url);
    const categoriesParam = url.searchParams.get('categories') ?? '';
    const region = url.searchParams.get('region');
    const count = Math.min(
      32,
      Math.max(2, Number(url.searchParams.get('count') ?? 8)),
    );
    // tournamentSize 는 수신만 (mock 동작에 영향 X)
    void url.searchParams.get('tournamentSize');
    const poolParam = url.searchParams.get('pool');
    const desired = poolParam !== null ? Number(poolParam) : count;
    const categories = categoriesParam
      ? categoriesParam.split(',').filter(Boolean)
      : [];

    let pool = destinationSeeds;
    if (categories.length > 0) {
      pool = pool.filter((d) => categories.includes(d.category));
    }
    if (region) {
      pool = pool.filter((d) => d.region === region);
    }
    // Fisher–Yates 부분 셔플
    const arr = pool.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const ai = arr[i];
      const aj = arr[j];
      if (ai !== undefined && aj !== undefined) {
        arr[i] = aj;
        arr[j] = ai;
      }
    }
    return HttpResponse.json(
      arr.slice(0, Math.min(arr.length, Math.max(count, desired))),
    );
  }),

  // 여행지 상세 — id 기반 deterministic mock 메타 합성.
  // 실 백엔드는 외부 데이터/큐레이션 DB 와 결합해 다양한 필드 제공.
  // 응답 필드는 모두 optional 이라 누락되어도 UI 가 자연스럽게 처리.
  http.get(`${apiUrl}/destinations/:id`, ({ params }) => {
    const id = String(params.id);
    const seed = destinationSeeds.find((d) => d.id === id);
    if (!seed) return new HttpResponse(null, { status: 404 });

    // id 기반 deterministic hash → 같은 id 면 항상 같은 mock 메타
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
    const u = (n: number) => (Math.abs(h + n) % 1000) / 1000; // 0~1

    const seasonPool: Array<'spring' | 'summer' | 'autumn' | 'winter'> = [
      'spring',
      'summer',
      'autumn',
      'winter',
    ];
    const bestSeasons = seasonPool.filter((_, i) => u(i + 1) > 0.4);

    const tagPool: Record<string, string[]> = {
      local: ['#로컬', '#시군대표', '#골목투어'],
      festival: ['#축제', '#연중행사', '#포토존'],
      attraction: ['#명소', '#자연', '#뷰맛집'],
      experience: ['#체험', '#가족', '#실내'],
    };
    const tags = tagPool[seed.category] ?? [];

    const detail = {
      ...seed,
      summary: `${seed.name} — ${seed.region} 대표 ${seed.category}`,
      photos: [
        // 실제 백엔드는 CDN URL. mock 은 placeholder 또는 빈 배열.
        // 클라이언트는 photos 없어도 카드만 보이도록 처리해야 함.
      ],
      address: `충북 ${seed.region.replace(/[a-z]+/i, '')} ${seed.name} 일대`,
      phone:
        u(10) > 0.3
          ? `043-${200 + Math.floor(u(11) * 800)}-${1000 + Math.floor(u(12) * 8999)}`
          : undefined,
      website: u(20) > 0.5 ? `https://example.com/${id}` : undefined,
      openingHours:
        u(30) > 0.3 ? '매일 09:00 - 18:00 (월요일 휴무)' : undefined,
      admissionFee:
        u(40) > 0.5
          ? `성인 ${1000 + Math.floor(u(41) * 9) * 1000}원 · 청소년 ${1000 + Math.floor(u(42) * 5) * 500}원`
          : '무료',
      tags: tags.length > 0 ? tags : undefined,
      rating: {
        value: Math.round((3.5 + u(50) * 1.5) * 10) / 10,
        count: 30 + Math.floor(u(51) * 470),
      },
      bestSeasons: bestSeasons.length > 0 ? bestSeasons : undefined,
      coords: {
        lat: 36.5 + u(60) * 1.2,
        lng: 127.4 + u(61) * 0.9,
      },
    };
    return HttpResponse.json(detail);
  }),

  // ===== Notifications =====
  // 인박스 + mutable read 상태. 새 알림은 push 시뮬레이션 endpoint 가 prepend.
  http.get(`${apiUrl}/notifications`, () =>
    HttpResponse.json({
      items: notificationItems,
      unreadCount: notificationItems.filter((n) => !n.read).length,
    }),
  ),
  http.post(`${apiUrl}/notifications/:id/read`, ({ params }) => {
    const id = String(params.id);
    const target = notificationItems.find((n) => n.id === id);
    if (target) target.read = true;
    return new HttpResponse(null, { status: 204 });
  }),
  http.post(`${apiUrl}/notifications/read-all`, () => {
    notificationItems.forEach((n) => {
      n.read = true;
    });
    return new HttpResponse(null, { status: 204 });
  }),
  // Push 구독 등록/해제 — 실 서버는 endpoint + p256dh + auth 를 사용자별로 저장.
  // mock 은 단순 ack.
  http.post(`${apiUrl}/notifications/subscribe`, async ({ request }) => {
    await request.json().catch(() => null); // 본문 검증 생략
    return new HttpResponse(null, { status: 204 });
  }),
  http.post(`${apiUrl}/notifications/unsubscribe`, async ({ request }) => {
    await request.json().catch(() => null);
    return new HttpResponse(null, { status: 204 });
  }),
  // mock 전용 — 새 편지 도착 시뮬레이션.
  // 클라이언트 dev tool 이 호출 → 알림함에 항목 prepend.
  // (Service Worker 의 push 이벤트는 별도 postMessage(MOCK_PUSH) 로 trigger.)
  http.post(`${apiUrl}/__mock/letter-arrive`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      from?: string;
      preview?: string;
      letterId?: string;
    };
    const id = `mock-${Date.now()}`;
    // 알림 클릭 시 정상 진입하도록 seed 의 받은 편지 중 random pick.
    // 그러지 않으면 link 가 letter-mock-... 같은 형태로 가서 detail 404.
    const receivedSeeds = letterSeeds.filter((l) => !l.isMine);
    const picked =
      receivedSeeds[Math.floor(Math.random() * receivedSeeds.length)];
    const letterId = body.letterId ?? picked?.id ?? 'letter-1';
    const fromLabel = body.from ?? picked?.author?.nickname ?? '익명의 여행자';
    notificationItems.unshift({
      id,
      type: 'letter.received',
      title: '새 편지가 도착했어요',
      body: body.preview ?? `${fromLabel} — ${picked?.body ?? '다섯 글자'}`,
      link: `/letter/${letterId}`,
      read: false,
      createdAt: new Date().toISOString(),
    });
    return HttpResponse.json({ id, link: `/letter/${letterId}` });
  }),

  // ===== Travel type test =====
  // 옵션은 단순 id+text만 반환 — 클라이언트는 점수 매핑 미인식
  http.get(`${apiUrl}/travel-types/quiz`, () =>
    HttpResponse.json(travelTypeQuizSeed),
  ),
  http.post(`${apiUrl}/travel-types/submit`, async ({ request }) => {
    const body = (await request.json()) as { answers: TravelTypeAnswer[] };
    const result = resolveTravelType(body.answers ?? []);
    myTravelType = result;
    return HttpResponse.json(result);
  }),
  http.get(`${apiUrl}/travel-types/me`, () => HttpResponse.json(myTravelType)),
];
