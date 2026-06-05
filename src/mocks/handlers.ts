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
import {
  savedTournamentSeeds,
  tournamentHistorySeeds,
} from './seeds/tournament';
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
import { isRegionCode } from '@/constants/regions';
import type { Destination } from '@/features/tournament/types';

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
 * 로그인 상태 — mock 환경에서 양 상태 토글.
 *   - 초기 true → demo 시작 시 mockUser 로 자동 로그인
 *   - POST /auth/logout / login 으로 토글
 *   - localStorage 영속화 — page reload 시에도 상태 유지 (handlers 모듈 재로드 회피).
 *     초기값 미설정 시 true.
 * 새 브라우저 세션 / mock 초기화 후엔 ?reset 같은 dev 도구 또는 직접 localStorage 클리어.
 */
const MOCK_SIGNED_IN_KEY = '__mock_signed_in';

function getMockSignedIn(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const v = window.localStorage.getItem(MOCK_SIGNED_IN_KEY);
    return v === null ? true : v === 'true';
  } catch {
    return true;
  }
}

function setMockSignedIn(v: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(MOCK_SIGNED_IN_KEY, String(v));
  } catch {
    /* noop */
  }
}

/**
 * 토너먼트 기록 인메모리 store — `POST /tournaments` 가 채우고
 * `GET /tournaments/:id` 가 읽음. SW 재기동 시 휘발 (mock 한정).
 */
const tournamentRecords = new Map<
  string,
  {
    id: string;
    winner: (typeof destinationSeeds)[number];
    runnerUp: (typeof destinationSeeds)[number] | null;
    matchesPlayed: number;
    tournamentSize: number;
    completedAt: string;
  }
>();

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

// Unauthorized response — 보호 endpoint 가 getMockSignedIn()=false 일 때 반환.
const unauthorized = () => new HttpResponse(null, { status: 401 });

export const handlers = [
  // ===== Auth =====
  http.post(`${apiUrl}/auth/login`, () => {
    setMockSignedIn(true);
    return HttpResponse.json({ success: true });
  }),
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
  http.post(`${apiUrl}/me/change-password`, () =>
    getMockSignedIn()
      ? new HttpResponse(null, { status: 204 })
      : unauthorized(),
  ),
  http.post(`${apiUrl}/auth/logout`, () => {
    setMockSignedIn(false);
    return new HttpResponse(null, { status: 204 });
  }),
  // refresh 도 getMockSignedIn() 반영 — false 일 때 401 반환해야 interceptor 의
  // refresh 흐름이 정상 종료. true 로 두면 /me 가 계속 401 인데도 refresh 가
  // 성공해 무한 retry → /login hard redirect 회귀.
  http.post(`${apiUrl}/auth/refresh`, () =>
    getMockSignedIn()
      ? new HttpResponse(null, { status: 204 })
      : unauthorized(),
  ),
  http.get(`${apiUrl}/me`, () =>
    getMockSignedIn()
      ? HttpResponse.json({ ...mockUser, isOnboarded: onboardedState })
      : unauthorized(),
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

  // ===== Letters ===== (모두 로그인 필요)
  // POST 응답으로 Letter 객체 반환 — /letter/sent?id= deep-link 가능하게.
  http.post(`${apiUrl}/letters`, async ({ request }) => {
    if (!getMockSignedIn()) return unauthorized();
    const body = (await request.json().catch(() => ({}))) as {
      body?: string;
      location?: { label?: string };
      isAnonymous?: boolean;
    };
    const id = `letter-new-${Date.now()}`;
    const now = new Date().toISOString();
    // 실 BE 도 동일 정책: isAnonymous=true 면 author.nickname 을 "익명의 여행자"
    // 로 마스킹, 위치는 그대로 노출. 닉네임 정상이면 user 의 닉네임을 사용
    // (mock 은 단일 사용자라 임시 '도장이' 사용).
    const nickname = body.isAnonymous ? '익명의 여행자' : '도장이';
    const letter = {
      id,
      body: body.body ?? '',
      author: {
        nickname,
        location: body.location?.label ?? '익명 위치',
      },
      arrivedAt: now,
      createdAt: now,
      isMine: true,
      liked: false,
      saved: false,
      likeCount: 0,
    };
    // /letters/:id GET 이 deep-link 진입 시 이 letter 를 찾도록 letterSeeds 에 prepend.
    letterSeeds.unshift(letter);
    return new HttpResponse(JSON.stringify(letter), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  }),
  // 편지 목록 — 모두 cursor 기반 페이지네이션 통일
  ...['received', 'sent', 'liked', 'saved'].map((kind) =>
    http.get(`${apiUrl}/letters/${kind}`, ({ request }) => {
      if (!getMockSignedIn()) return unauthorized();
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
    if (!getMockSignedIn()) return unauthorized();
    const seed = letterSeeds.find((l) => l.id === params.id);
    if (!seed) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(seed);
  }),
  http.delete(`${apiUrl}/letters/:id`, () =>
    getMockSignedIn()
      ? new HttpResponse(null, { status: 204 })
      : unauthorized(),
  ),
  http.post(`${apiUrl}/letters/:id/like`, ({ params }) => {
    if (!getMockSignedIn()) return unauthorized();
    const seed = letterSeeds.find((l) => l.id === params.id);
    if (!seed) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ ...seed, liked: !seed.liked });
  }),
  http.post(`${apiUrl}/letters/:id/save`, ({ params }) => {
    if (!getMockSignedIn()) return unauthorized();
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

  // 시군 summary — 헤더 이미지 / 설명 / 인기도. RegionHero 등에서 사용.
  // mock 은 description 만 deterministic — 실 BE 는 TourAPI 또는 CMS.
  http.get(`${apiUrl}/regions/:code/summary`, ({ params }) => {
    const code = params.code as string;
    if (!isRegionCode(code)) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({
      code,
      heroImage: undefined,
      description: `${code} 시군의 명소와 축제, 체험 정보를 한눈에.`,
      popularity: 50,
    });
  }),

  // 진행 중 축제 — 홈 FestivalCarousel.
  // 실 BE 는 eventStart/eventEnd 가 오늘 포함되는 row 만 반환. mock 은 시드의
  // festival 카테고리 8개 (region 별 1-2개) 를 반환.
  http.get(`${apiUrl}/regions/ongoing-festivals`, ({ request }) => {
    const url = new URL(request.url);
    const region = url.searchParams.get('region');
    const filtered = destinationSeeds
      .filter((d) => d.category === 'festival')
      .filter((d) => !region || d.region === region)
      .slice(0, 8)
      .map((d) => ({
        id: d.id,
        contentId: d.id,
        type: 'festival' as const,
        region: d.region,
        title: d.name,
        summary: undefined,
        imageUrl: undefined,
        eventStart: undefined,
        eventEnd: undefined,
      }));
    return HttpResponse.json(filtered);
  }),

  // ===== Rankings =====
  http.get(`${apiUrl}/rankings`, ({ request }) => {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const limit = Number(url.searchParams.get('limit') ?? 5);

    if (type === 'weekly-winners') {
      // 시군당 1개 규칙 — region 기준 dedupe 후 상위 N개. 같은 시군의 여러
      // destination 이 우승해도 대표 1개만 노출 (정책: 시군 다양성 우선).
      const seenRegion = new Set<string>();
      const deduped: typeof destinationSeeds = [];
      for (const d of destinationSeeds) {
        if (seenRegion.has(d.region)) continue;
        seenRegion.add(d.region);
        deduped.push(d);
        if (deduped.length >= Math.min(limit, 11)) break;
      }
      const top = deduped.map((d, i) => ({
        rank: i + 1,
        destination: d,
        score: 28 - i * 3, // 28, 25, 22, 19, 16 ...
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

    // 추천 destination — 시즌/카테고리 균형 분포 (mock 은 destinationSeeds shuffle).
    if (type === 'recommended') {
      const items = destinationSeeds.slice(0, Math.min(limit, 10)).map((d) => ({
        rank: 0,
        destination: d,
        score: 0,
      }));
      return HttpResponse.json(items);
    }

    // 숨겨진 보석 — 우승 적은 destination (popularity 역순 시뮬). mock 은 뒤에서.
    if (type === 'hidden-gems') {
      const items = destinationSeeds
        .slice(-Math.min(limit, 10))
        .reverse()
        .map((d) => ({ rank: 0, destination: d, score: 0 }));
      return HttpResponse.json(items);
    }

    return HttpResponse.json([]);
  }),

  // ===== MyPage ===== (모두 로그인 필요)
  // 마이페이지 요약 — 프로필 / 저장된 우승지 / 저장·좋아요 편지 / 여행 유형.
  http.get(`${apiUrl}/mypage`, () =>
    getMockSignedIn()
      ? HttpResponse.json({
          profile: { nickname: mockUser.nickname, isDefault: false },
          savedTournaments: savedTournamentSeeds,
          savedLetters: letterSeeds.filter((l) => l.saved).slice(0, 5),
          likedLetters: letterSeeds.filter((l) => l.liked).slice(0, 5),
          travelType: myTravelType,
        })
      : unauthorized(),
  ),
  // 닉네임 변경 (PATCH /mypage/profile)
  http.patch(`${apiUrl}/mypage/profile`, async ({ request }) => {
    if (!getMockSignedIn()) return unauthorized();
    const body = (await request.json().catch(() => ({}))) as {
      nickname?: string;
    };
    return HttpResponse.json({
      nickname: body.nickname ?? mockUser.nickname,
      isDefault: false,
    });
  }),
  // 저장된 토너먼트 우승지 — 목록. summary 의 savedTournaments 와 같은 시드.
  http.get(`${apiUrl}/mypage/tournaments`, () =>
    getMockSignedIn()
      ? HttpResponse.json(savedTournamentSeeds)
      : unauthorized(),
  ),

  // 저장된 토너먼트 우승지 삭제 — /mypage/saved-tournaments 의 하트 클릭 흐름.
  // seed array 를 in-place splice 로 mutate → 같은 세션 내 list/refetch 에 반영.
  http.delete(`${apiUrl}/mypage/tournaments/:id`, ({ params }) => {
    if (!getMockSignedIn()) return unauthorized();
    const idx = savedTournamentSeeds.findIndex((s) => s.id === params.id);
    if (idx < 0) return new HttpResponse(null, { status: 404 });
    savedTournamentSeeds.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // ===== Settings ===== (모두 로그인 필요)
  http.get(`${apiUrl}/settings`, () =>
    getMockSignedIn()
      ? HttpResponse.json({
          notifications: {
            pushEnabled: false,
            inAppEnabled: true,
            letterReceived: true,
            letterLiked: true,
          },
        })
      : unauthorized(),
  ),
  http.patch(`${apiUrl}/settings/notifications`, async ({ request }) => {
    if (!getMockSignedIn()) return unauthorized();
    const patch = (await request.json().catch(() => ({}))) as Record<
      string,
      boolean
    >;
    return HttpResponse.json({
      notifications: {
        pushEnabled: patch.pushEnabled ?? false,
        inAppEnabled: patch.inAppEnabled ?? true,
        letterReceived: patch.letterReceived ?? true,
        letterLiked: patch.letterLiked ?? true,
      },
    });
  }),

  // ===== Stamps (도장깨기) =====
  http.get(`${apiUrl}/mypage/stamps`, () => {
    if (!getMockSignedIn()) return unauthorized();
    const visited = Array.from(
      new Set(tournamentHistorySeeds.map((t) => t.winnerRegion)),
    );
    return HttpResponse.json({ visited, total: 11 });
  }),

  // ===== Tournament =====
  http.get(`${apiUrl}/mypage/tournament-history`, () =>
    getMockSignedIn()
      ? HttpResponse.json({ items: tournamentHistorySeeds, nextCursor: null })
      : unauthorized(),
  ),

  // 토너먼트 기록 — Play 종료 시 fire-and-forget. record id 반환.
  // 인메모리 (`tournamentRecords`) 에 저장 → GET /tournaments/:id 로 deep-link 복원.
  http.post(`${apiUrl}/tournaments`, async ({ request }) => {
    const body = (await request.json()) as {
      winnerId: string;
      runnerUpId: string | null;
      matchesPlayed: number;
      tournamentSize: number;
    };
    const winner = destinationSeeds.find((d) => d.id === body.winnerId);
    if (!winner) return new HttpResponse(null, { status: 404 });
    const runnerUp = body.runnerUpId
      ? (destinationSeeds.find((d) => d.id === body.runnerUpId) ?? null)
      : null;
    const record = {
      id: `tr-${Date.now()}`,
      winner,
      runnerUp,
      matchesPlayed: body.matchesPlayed,
      tournamentSize: body.tournamentSize,
      completedAt: new Date().toISOString(),
    };
    tournamentRecords.set(record.id, record);
    return HttpResponse.json(record);
  }),

  // Deep-link 진입 시 record 조회.
  http.get(`${apiUrl}/tournaments/:id`, ({ params }) => {
    const id = String(params.id);
    const record = tournamentRecords.get(id);
    if (!record) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(record);
  }),

  // 우승 여행지를 마이페이지에 저장 (인증 필요)
  http.post(`${apiUrl}/mypage/tournaments`, async ({ request }) => {
    if (!getMockSignedIn()) return unauthorized();
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
  // 관련 여행지 — 같은 region 의 다른 destination 6개. seed 기반 deterministic.
  // ⚠ /destinations/:id 보다 먼저 등록 — :id 가 'related' segment 도 매칭하므로
  //   path 명시 (`/destinations/:id/related`) 가 더 길어 우선되지만 안전을 위해 앞에.
  http.get(`${apiUrl}/destinations/:id/related`, ({ params }) => {
    const id = String(params.id);
    const target =
      destinationSeeds.find((d) => d.id === id) ??
      (() => {
        const rc = regionContentSeeds.find((r) => r.id === id);
        return rc
          ? ({
              id: rc.id,
              name: rc.title,
              category: rc.type,
              region: rc.region,
            } as const)
          : null;
      })();
    if (!target) return HttpResponse.json([]);
    const related = destinationSeeds
      .filter((d) => d.region === target.region && d.id !== id)
      .slice(0, 6);
    return HttpResponse.json(related);
  }),

  // ⚠ 반드시 `/destinations/:id` 보다 먼저 등록 — :id 가 'random' 도 매칭하므로.
  //
  // 토너먼트 매치업용 random destination 응답 (BE 구현 spec example).
  //
  // Query:
  //   - themeKind: 'season' | 'mood' | ...      (filter, 선택)
  //   - themeValue: 'spring' | 'summer' | ...   (filter, 선택)
  //   - categories: 'festival,attraction'       (comma-separated enum filter)
  //   - regions:   'cheongju,boeun'             (comma-separated, FE 가 map phase 에서 결정한 N 시군 — 필수)
  //   - tournamentSize: 4 | 8 | 16 | 32         (응답 destination 갯수 — strict)
  //
  // 응답:
  //   - 정확히 tournamentSize 개 (단, regions 안의 데이터가 더 적으면 가능한 만큼)
  //   - 시군 균형 분배 — regions 안의 각 시군에서 가능한 한 다양하게 pick
  //     · regions.length ≥ tournamentSize: 각 시군 1개씩 우선
  //     · regions.length <  tournamentSize: 시군 1순환 + 같은 시군 다른 destination 으로 채움
  //   - id 중복 0 (Bracket 이 같은 카드 두 번 그리는 사고 차단)
  //
  // 합의: count / pool / region(단일) param 폐기. 시군은 응답 destination.region 에서 추출.
  http.get(`${apiUrl}/destinations/random`, ({ request }) => {
    const url = new URL(request.url);
    const categoriesParam = url.searchParams.get('categories') ?? '';
    const regionsParam = url.searchParams.get('regions') ?? '';

    const VALID_SIZES = [4, 8, 16, 32];
    const rawSize = Number(url.searchParams.get('tournamentSize') ?? 8);
    const tournamentSize = VALID_SIZES.includes(rawSize) ? rawSize : 8;

    const categories = categoriesParam
      ? categoriesParam.split(',').filter(Boolean)
      : [];
    const regions = regionsParam ? regionsParam.split(',').filter(Boolean) : [];

    let pool = destinationSeeds;
    if (categories.length > 0) {
      pool = pool.filter((d) => categories.includes(d.category));
    }
    if (regions.length > 0) {
      pool = pool.filter((d) => regions.includes(d.region));
    }
    // Fisher–Yates 셔플
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

    // 시군 균형 분배 우선 + 부족 시 같은 시군 다른 destination 채움.
    const seenRegions = new Set<string>();
    const seenIds = new Set<string>();
    const picked: typeof arr = [];
    for (const d of arr) {
      if (seenRegions.has(d.region)) continue;
      seenRegions.add(d.region);
      seenIds.add(d.id);
      picked.push(d);
      if (picked.length >= tournamentSize) break;
    }
    if (picked.length < tournamentSize) {
      for (const d of arr) {
        if (seenIds.has(d.id)) continue;
        seenIds.add(d.id);
        picked.push(d);
        if (picked.length >= tournamentSize) break;
      }
    }
    return HttpResponse.json(picked);
  }),

  // 여행지 상세 — id 기반 deterministic mock 메타 합성.
  // 실 백엔드는 외부 데이터/큐레이션 DB 와 결합해 다양한 필드 제공.
  // 응답 필드는 모두 optional 이라 누락되어도 UI 가 자연스럽게 처리.
  //
  // ⚠️ 두 id space 모두 받음:
  //   - destination id 형태 (예: 'boeun-attraction-1') — 토너먼트 우승지
  //   - region content id 형태 (예: 'boeun-1')         — 시군 상세 row 클릭
  // 후자의 경우 regionContentSeeds 에서 찾아 Destination 형태로 정규화.
  http.get(`${apiUrl}/destinations/:id`, ({ params }) => {
    const id = String(params.id);
    let seed = destinationSeeds.find((d) => d.id === id);
    if (!seed) {
      const rc = regionContentSeeds.find((r) => r.id === id);
      if (rc) {
        seed = {
          id: rc.id,
          name: rc.title,
          category: rc.type as Destination['category'],
          region: rc.region,
          description: rc.summary,
          imageUrl: rc.imageUrl,
        };
      }
    }
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

    // mock photos — deterministic SVG data URL 3장 (id 기반 hue 변동).
    // CSP `img-src: 'self' data: blob:` 에 data: 허용되어 있음.
    // 실 BE 는 CDN URL.
    const baseHue = Math.floor(u(70) * 360);
    const photos = [0, 1, 2].map((i) => {
      const hue = (baseHue + i * 60) % 360;
      const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice">` +
        `<defs><linearGradient id="g${i}" x1="0" y1="0" x2="1" y2="1">` +
        `<stop offset="0%" stop-color="hsl(${hue},70%,75%)"/>` +
        `<stop offset="100%" stop-color="hsl(${(hue + 30) % 360},60%,55%)"/>` +
        `</linearGradient></defs>` +
        `<rect width="600" height="400" fill="url(#g${i})"/>` +
        `<text x="50%" y="55%" text-anchor="middle" font-size="40" font-weight="700" fill="rgba(255,255,255,0.85)">${seed.name}</text>` +
        `<text x="50%" y="72%" text-anchor="middle" font-size="20" fill="rgba(255,255,255,0.7)">${i + 1} / 3</text>` +
        `</svg>`;
      return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    });

    const closedDaysPool = [
      '매주 월요일',
      '매주 화요일',
      '설/추석 당일',
      '첫째·셋째 월요일',
    ];
    const detail = {
      ...seed,
      // description 은 base Destination 필드 — seed 에 없으면 합성.
      description:
        seed.description ??
        `${seed.name} — ${seed.region} 대표 ${seed.category}`,
      photos,
      address: `충북 ${seed.region.replace(/[a-z]+/i, '')} ${seed.name} 일대`,
      phone:
        u(10) > 0.3
          ? `043-${200 + Math.floor(u(11) * 800)}-${1000 + Math.floor(u(12) * 8999)}`
          : undefined,
      website: u(20) > 0.5 ? `https://example.com/${id}` : undefined,
      openingHours: u(30) > 0.3 ? '매일 09:00 - 18:00' : undefined,
      closedDays:
        u(31) > 0.4
          ? (closedDaysPool[Math.floor(u(32) * closedDaysPool.length)] ??
            undefined)
          : undefined,
      admissionFee:
        u(40) > 0.5
          ? `성인 ${1000 + Math.floor(u(41) * 9) * 1000}원 · 청소년 ${1000 + Math.floor(u(42) * 5) * 500}원`
          : '무료',
      parkingAvailable: u(45) > 0.5 ? u(46) > 0.3 : undefined,
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

  // ===== Notifications ===== (모두 로그인 필요)
  http.get(`${apiUrl}/notifications`, () =>
    getMockSignedIn()
      ? HttpResponse.json({
          items: notificationItems,
          unreadCount: notificationItems.filter((n) => !n.read).length,
        })
      : unauthorized(),
  ),
  http.post(`${apiUrl}/notifications/:id/read`, ({ params }) => {
    if (!getMockSignedIn()) return unauthorized();
    const id = String(params.id);
    const target = notificationItems.find((n) => n.id === id);
    if (target) target.read = true;
    return new HttpResponse(null, { status: 204 });
  }),
  http.post(`${apiUrl}/notifications/read-all`, () => {
    if (!getMockSignedIn()) return unauthorized();
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
  // 적용된 본인 유형 — 비로그인 시 null (getMockSignedIn() 무관, 비로그인은 적용 불가).
  http.get(`${apiUrl}/travel-types/me`, () =>
    getMockSignedIn() ? HttpResponse.json(myTravelType) : unauthorized(),
  ),

  // 명시 적용 — quiz 결과 페이지의 "내 유형으로 적용" 버튼. 로그인 필요.
  http.patch(`${apiUrl}/travel-types/me`, async ({ request }) => {
    if (!getMockSignedIn()) return unauthorized();
    const { code } = (await request.json()) as { code: string };
    const meta = (travelTypeMetaSeed as Record<string, TravelType>)[code];
    if (!meta) return new HttpResponse(null, { status: 404 });
    // recommended 는 quiz 흐름 의 resolveTravelType 가 build — 명시 set 은 meta 만.
    myTravelType = { ...meta, recommended: [] };
    return HttpResponse.json(myTravelType);
  }),
];
