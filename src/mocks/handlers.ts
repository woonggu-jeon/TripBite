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
import { HttpResponse, http } from 'msw';
import { travelTypeFromCode } from '@/constants/travel-types';
import type { TravelTypeAnswer } from '@/features/ranking/types';
import type {
  AppNotificationDto,
  DestinationDto,
  TravelTypeDto,
} from '@/types/api-domain';
import { destinationSeeds } from './seeds/destinations';
import { letterSeeds } from './seeds/letters';
import { notificationSeeds } from './seeds/notifications';
import { regionContentSeeds } from './seeds/regions';
import {
  savedTournamentSeeds,
  tournamentHistorySeeds,
} from './seeds/tournament';
import {
  type TravelTypeMockCode,
  travelTypeMetaSeed,
  travelTypeMockScoreMap,
  travelTypeQuizSeed,
} from './seeds/travel-types';

/**
 * URL 매칭 base — axios baseURL 단일화 (`/api/backend`, services/api/client.ts).
 * MSW handler 도 same-origin path 로 매칭.
 */
const apiUrl = '/api/backend';

export const mockSeeds = {
  regions: regionContentSeeds,
  letters: letterSeeds,
  tournaments: tournamentHistorySeeds,
  notifications: notificationSeeds,
  apiUrl,
};

/**
 * Festival mock 일자 — deterministic (id hash 기반). YYYY-MM-DD.
 * 2026 년 중 hash 로 결정된 첫 일자 + offsetDays.
 * BE 실 데이터는 TourAPI 의 eventstartdate/eventenddate 정규화 값.
 */
function mockFestivalDate(idHash: number, offsetDays: number): string {
  const dayOfYear = Math.abs(idHash) % 365;
  const base = new Date('2026-01-01T00:00:00Z');
  base.setUTCDate(base.getUTCDate() + dayOfYear + offsetDays);
  return base.toISOString().slice(0, 10);
}

// Spring UserResponseDto shape (avatarUrl/homeRegion/isOnboarded 미제공 — Vertical 4).
const mockUser = {
  id: '1',
  username: 'tester01',
  name: '홍길동',
  nickname: '테스터',
  email: 't@e.com',
  phone: '010-1234-5678',
  birthDate: '1995-03-01',
  createdAt: '2026-01-01T00:00:00Z',
} as const;

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
 * 여행 유형 테스트 — 사용자의 저장된 유형 코드(mutable). submit/PATCH me 시 갱신.
 * Spring: GET /me.travelType 는 코드 문자열. dev 서버 재시작 시 null 로 리셋.
 */
let myTravelTypeCode: TravelTypeMockCode | null = null;

/**
 * 알림 인박스 (mutable) — seed 복사. push 시뮬레이션 / markRead 가 mutate.
 * dev 서버 재시작 시 seed 로 reset.
 *
 * seed 는 type / read / createdAt 만 가지지만 AppNotificationDto 는 title 필수
 * (그 외 body/link 는 옵션). title/body 는 type 에서 derive 해 채워둠.
 */
const TITLE_BY_TYPE: Record<string, string> = {
  'letter.received': '청주시에서 3글자 편지가 왔어요',
  'letter.liked': '내 편지에 좋아요',
  'letter.delivered': '내 편지가 누군가에게 도착했어요 ✈',
  event: '새 소식',
  'tournament.shared': '토너먼트 공유',
  security: '보안 알림',
};
const notificationItems: AppNotificationDto[] = notificationSeeds.map((n) => ({
  id: n.id,
  type: n.type as AppNotificationDto['type'],
  // showcase seed 는 title/link 자체 보유, 일반 seed 는 type 기반 fallback.
  title: n.title ?? TITLE_BY_TYPE[n.type] ?? '알림',
  link: n.link,
  read: n.read,
  createdAt: n.createdAt,
}));

/**
 * mock 측 점수 계산 — answers 의 optionId 마다 매핑된 유형에 +1, 최고점 유형 반환.
 * 동점 시 첫 등장 유형 우선 (Map 순서). 반환은 Spring TravelTypeResultDto 파생 shape.
 */
function resolveTravelType(answers: TravelTypeAnswer[]): TravelTypeDto {
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
  return travelTypeMetaSeed[best];
}

// 11 시군 라벨 — rankings/by-region 응답에서 사용.
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

// Unauthorized response — 보호 endpoint 가 getMockSignedIn()=false 일 때 반환.
const unauthorized = () => new HttpResponse(null, { status: 401 });

export const handlers = [
  // ===== Auth =====
  // login — dev/mock 분기:
  //   username = 'locked'  → 429 AUTH_ACCOUNT_LOCKED (계정 잠금 UX 검증)
  //   username = 'limited' → 429 RATE_LIMIT (IP rate-limit UX 검증)
  //   username = 'wrong'   → 401 AUTH_INVALID_CREDENTIALS
  //   그 외                  → 200 success (정상 로그인)
  http.post(`${apiUrl}/auth/login`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      username?: string;
    };
    const username = body.username ?? '';
    if (username === 'locked') {
      return HttpResponse.json(
        { code: 'AUTH_ACCOUNT_LOCKED', message: '계정이 잠겼어요' },
        { status: 429 },
      );
    }
    if (username === 'limited') {
      return HttpResponse.json(
        { code: 'RATE_LIMIT', message: '잠시 후 다시 시도해주세요' },
        { status: 429 },
      );
    }
    if (username === 'wrong') {
      return HttpResponse.json(
        {
          code: 'AUTH_INVALID_CREDENTIALS',
          message: '아이디/비밀번호가 일치하지 않아요',
        },
        { status: 401 },
      );
    }
    setMockSignedIn(true);
    // 신규 Spring BE: ApiResponse<LoginResponseDto> — userId 만. (프로필은 GET /me)
    return HttpResponse.json({
      success: true,
      message: null,
      data: { userId: Number(mockUser.id) || 1 },
    });
  }),
  // 신규 Spring BE: signup 은 세션 발급 + ApiResponseUnit(user 없음).
  // FE(useSignup)는 폼 입력값으로 pendingUser 구성. mock 도 세션만 established.
  http.post(`${apiUrl}/auth/signup`, () => {
    setMockSignedIn(true);
    return HttpResponse.json(
      { success: true, message: null, data: {} },
      { status: 201 },
    );
  }),
  http.post(`${apiUrl}/auth/logout`, () => {
    setMockSignedIn(false);
    return new HttpResponse(null, { status: 204 });
  }),
  // POST /auth/refresh 는 sessionID 모델로 전환되며 폐기 (BE Swagger §Auth).
  // 신규 Spring BE: ApiResponse<UserResponseDto> 엔벨로프.
  http.get(`${apiUrl}/me`, () =>
    getMockSignedIn()
      ? HttpResponse.json({
          success: true,
          message: null,
          // Spring UserResponseDto: travelType 은 코드 문자열(null 가능).
          data: { ...mockUser, travelType: myTravelTypeCode },
        })
      : unauthorized(),
  ),
  // ===== Letters ===== (모두 로그인 필요)
  // POST 응답으로 LetterDto 객체 반환 — /letter/sent?id= deep-link 가능하게.
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
      // 보낸 편지는 자기 글이라 항상 read true.
      read: true,
    };
    // /letters/:id GET 이 deep-link 진입 시 이 letter 를 찾도록 letterSeeds 에 prepend.
    letterSeeds.unshift(letter);
    // 신규 Spring BE: ApiResponse<LetterDto> 엔벨로프.
    return HttpResponse.json(
      { success: true, message: null, data: letter },
      { status: 201 },
    );
  }),
  // 편지 목록 — 신규 Spring BE: cursor/size + ApiResponse<LetterPageDto> 엔벨로프.
  ...['received', 'sent', 'liked', 'saved'].map((kind) =>
    http.get(`${apiUrl}/letters/${kind}`, ({ request }) => {
      if (!getMockSignedIn()) return unauthorized();
      const url = new URL(request.url);
      const cursor = Number(url.searchParams.get('cursor') ?? 0);
      const size = Number(
        url.searchParams.get('size') ?? url.searchParams.get('limit') ?? 10,
      );
      let pool = letterSeeds;
      if (kind === 'sent') pool = letterSeeds.filter((l) => l.isMine);
      else if (kind === 'received') pool = letterSeeds.filter((l) => !l.isMine);
      else if (kind === 'liked') pool = letterSeeds.filter((l) => l.liked);
      else if (kind === 'saved') pool = letterSeeds.filter((l) => l.saved);
      const slice = pool.slice(cursor, cursor + size);
      const nextCursor = cursor + size < pool.length ? cursor + size : null;
      return HttpResponse.json({
        success: true,
        message: null,
        data: { items: slice, nextCursor },
      });
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
  // 페이지네이션 — BE Swagger §Region:
  //   cursor=offset(기본 0), limit=페이지 크기(기본 20, 최대 60).
  //   nextCursor=다음 요청에 그대로 넘길 offset, 마지막 페이지면 null.
  http.get(`${apiUrl}/regions/:code/contents`, ({ params, request }) => {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const cursorRaw = url.searchParams.get('cursor');
    const limitRaw = url.searchParams.get('limit');
    const cursor = Math.max(0, Number(cursorRaw) || 0);
    const limit = Math.min(60, Math.max(1, Number(limitRaw) || 20));
    const all = regionContentSeeds.filter(
      (r) => r.region === params.code && (!type || r.type === type),
    );
    const slice = all.slice(cursor, cursor + limit);
    const next = cursor + slice.length;
    const nextCursor = next < all.length ? next : null;
    return HttpResponse.json({ items: slice, nextCursor });
  }),

  // 진행 중 축제 / 다가오는 축제 / 인기 여행지 — 홈 FestivalCarousel.
  // 실 BE 는 3단계 폴백 후 single response. mock 은 항상 'upcoming' 분기를 반환해
  // D-day 뱃지 UI 도 같이 검증 가능.
  // 신규 Spring BE: region 필터 없음 + ApiResponse<OngoingFestivalsDto> 엔벨로프.
  http.get(`${apiUrl}/regions/ongoing-festivals`, () => {
    const items = destinationSeeds
      .filter((d) => d.category === 'festival')
      .slice(0, 8)
      .map((d, i) => ({
        id: Number(d.id) || i + 1,
        name: d.name,
        imageUrl: null,
        regionLabel: d.region,
        // 7, 14, 21 ... 일 후 시작 — D-day 뱃지 다양성 검증.
        daysToStart: 7 + i * 7,
        eventStartDate: null,
        eventEndDate: null,
      }));
    return HttpResponse.json({
      success: true,
      message: null,
      data: { type: 'upcoming', items },
    });
  }),

  // ===== Rankings (신규 Spring BE) =====
  // 주간 top destination — ApiResponse<WeeklyTopDestinationsDto>.
  // items 는 {destinationId,destinationName,winCount} (image/region 미제공 — 새 BE 계약).
  http.get(`${apiUrl}/tournaments/rankings/weekly`, ({ request }) => {
    const size = Number(new URL(request.url).searchParams.get('size') ?? 5);
    const seenRegion = new Set<string>();
    const deduped: typeof destinationSeeds = [];
    for (const d of destinationSeeds) {
      if (seenRegion.has(d.region)) continue;
      seenRegion.add(d.region);
      deduped.push(d);
      if (deduped.length >= Math.min(size, 11)) break;
    }
    const items = deduped.map((d, i) => ({
      destinationId: Number(d.id) || i + 1,
      destinationName: d.name,
      winCount: 28 - i * 3,
    }));
    return HttpResponse.json({
      success: true,
      message: null,
      data: {
        year: 2026,
        month: 7,
        weekOfMonth: 3,
        weekStart: '2026-07-20',
        weekEnd: '2026-07-26',
        items,
      },
    });
  }),
  // 시군별 우승 횟수 — ApiResponse<RegionWinCountDto[]>.
  http.get(`${apiUrl}/tournaments/rankings/regions`, () => {
    const data = MOCK_REGIONS.map((r, i) => ({
      region: r.regionCode,
      winCount: 48 - i * 3 + ((i * 7) % 5),
    })).sort((a, b) => b.winCount - a.winCount);
    return HttpResponse.json({ success: true, message: null, data });
  }),

  // ===== Rankings (구 generated mock — recommended/by-category/seasonal 등) =====
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

    // 추천 destination — 카테고리 균형 분포.
    // 구현이 seeds 앞에서 slice 만 했어서 한 시군의 축제만 잔뜩 나왔고, 홈의
    // 카테고리 칩 필터에 관광지/체험 항목이 비었다. 카테고리별로 라운드로빈.
    if (type === 'recommended') {
      const byCategory = new Map<string, typeof destinationSeeds>();
      for (const d of destinationSeeds) {
        const list = byCategory.get(d.category) ?? [];
        list.push(d);
        byCategory.set(d.category, list);
      }
      const buckets = [...byCategory.values()];
      const picked: typeof destinationSeeds = [];
      const cap = Math.min(limit, 24);
      for (let i = 0; picked.length < cap; i++) {
        let added = false;
        for (const b of buckets) {
          const next = b[i];
          if (next && picked.length < cap) {
            picked.push(next);
            added = true;
          }
        }
        if (!added) break;
      }
      const items = picked.map((d) => ({ rank: 0, destination: d, score: 0 }));
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
  // 마이페이지 요약 — 프로필 / 여행 유형만. 저장 우승지·편지는 별도 endpoint 영역 분리
  // (`/mypage/tournaments`, `/letters/{saved,liked}`) — BE 응답 정합 2026-06-11.
  http.get(`${apiUrl}/mypage`, () =>
    getMockSignedIn()
      ? HttpResponse.json({
          profile: { nickname: mockUser.nickname, isDefault: false },
          travelType: myTravelTypeCode
            ? travelTypeFromCode(myTravelTypeCode)
            : null,
        })
      : unauthorized(),
  ),
  // 신규 Spring BE: 프로필 수정 PATCH /me — ApiResponse<UserResponseDto>.
  // travelType(코드) 갱신도 여기서 (4-A: travel-types/me PATCH 대체).
  http.patch(`${apiUrl}/me`, async ({ request }) => {
    if (!getMockSignedIn()) return unauthorized();
    const body = (await request.json().catch(() => ({}))) as {
      nickname?: string;
      travelType?: TravelTypeMockCode;
    };
    if (body.travelType) myTravelTypeCode = body.travelType;
    return HttpResponse.json({
      success: true,
      message: null,
      data: {
        ...mockUser,
        nickname: body.nickname ?? mockUser.nickname,
        travelType: myTravelTypeCode,
      },
    });
  }),
  // 저장된 토너먼트 우승지 — 목록. summary 의 savedTournaments 와 같은 시드.
  // 신규 Spring BE: ApiResponse<SavedTournamentDto[]> 엔벨로프.
  http.get(`${apiUrl}/mypage/tournaments`, () =>
    getMockSignedIn()
      ? HttpResponse.json({
          success: true,
          message: null,
          data: savedTournamentSeeds,
        })
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
  // 신규 Spring BE: ApiResponse<SettingsDto> 엔벨로프.
  http.get(`${apiUrl}/settings`, () =>
    getMockSignedIn()
      ? HttpResponse.json({
          success: true,
          message: null,
          data: {
            notifications: {
              pushEnabled: false,
              inAppEnabled: true,
              letterReceived: true,
              letterLiked: true,
            },
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
      success: true,
      message: null,
      data: {
        notifications: {
          pushEnabled: patch.pushEnabled ?? false,
          inAppEnabled: patch.inAppEnabled ?? true,
          letterReceived: patch.letterReceived ?? true,
          letterLiked: patch.letterLiked ?? true,
        },
      },
    });
  }),

  // ===== Stamps (도장깨기) =====
  // 신규 Spring BE: ApiResponse<StampsDto> 엔벨로프.
  http.get(`${apiUrl}/mypage/stamps`, () => {
    if (!getMockSignedIn()) return unauthorized();
    const visited = Array.from(
      new Set(tournamentHistorySeeds.map((t) => t.winnerRegion)),
    );
    return HttpResponse.json({
      success: true,
      message: null,
      data: { visited, total: 11 },
    });
  }),

  // ===== Tournament =====
  // 페이지네이션 — 편지/시군콘텐츠와 동일 컨벤션: cursor=offset(기본 0),
  // limit=페이지 크기(기본 20, 최대 60). 마지막 페이지면 nextCursor=null.
  // 신규 Spring BE: ApiResponse<TournamentSummaryDto[]> (flat, cursor 없음).
  http.get(`${apiUrl}/mypage/tournament-history`, () => {
    if (!getMockSignedIn()) return unauthorized();
    const data = tournamentHistorySeeds.map((t, i) => ({
      id: Number(String(t.id).replace(/\D/g, '')) || i + 1,
      winnerName: t.winnerName,
      tournamentSize: t.count,
      category: t.category,
      completedAt: t.completedAt,
    }));
    return HttpResponse.json({ success: true, message: null, data });
  }),

  // 신규 Spring BE: 토너먼트 결과 기록 — POST /mypage/tournament-history.
  // body: { winnerId?, winnerName, region?, category?, tournamentSize? }.
  // 응답 thin ApiResponse<TournamentSummaryDto>. (결과 딥링크 복원은 Spring 미지원 —
  // 결과 화면은 store 전용이라 record 저장 불필요.)
  http.post(`${apiUrl}/mypage/tournament-history`, async ({ request }) => {
    const body = (await request.json()) as {
      winnerId?: number;
      winnerName?: string;
      region?: string;
      category?: string;
      tournamentSize?: number;
    };
    return HttpResponse.json({
      success: true,
      message: null,
      data: {
        id: Date.now(),
        winnerName: body.winnerName,
        tournamentSize: body.tournamentSize,
        category: body.category,
        completedAt: new Date().toISOString(),
      },
    });
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
    // 신규 Spring BE: 단일 category/region/season + size. (구 categories/regions/tournamentSize 도 하위호환)
    const category =
      url.searchParams.get('category') ?? url.searchParams.get('categories');
    const region =
      url.searchParams.get('region') ?? url.searchParams.get('regions');

    const VALID_SIZES = [4, 8, 16, 32];
    const rawSize = Number(
      url.searchParams.get('size') ??
        url.searchParams.get('tournamentSize') ??
        8,
    );
    const tournamentSize = VALID_SIZES.includes(rawSize) ? rawSize : 8;

    const categories = category ? category.split(',').filter(Boolean) : [];
    const regions = region ? region.split(',').filter(Boolean) : [];

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
    return HttpResponse.json({ success: true, message: null, data: picked });
  }),

  // 여행지 상세 — id 기반 deterministic mock 메타 합성.
  // 실 백엔드는 외부 데이터/큐레이션 DB 와 결합해 다양한 필드 제공.
  // 응답 필드는 모두 optional 이라 누락되어도 UI 가 자연스럽게 처리.
  //
  // ⚠️ 두 id space 모두 받음:
  //   - destination id 형태 (예: 'boeun-attraction-1') — 토너먼트 우승지
  //   - region content id 형태 (예: 'boeun-1')         — 시군 상세 row 클릭
  // 후자의 경우 regionContentSeeds 에서 찾아 DestinationDto 형태로 정규화.
  http.get(`${apiUrl}/destinations/:id`, ({ params }) => {
    const id = String(params.id);
    let seed = destinationSeeds.find((d) => d.id === id);
    if (!seed) {
      const rc = regionContentSeeds.find((r) => r.id === id);
      if (rc) {
        seed = {
          id: rc.id,
          name: rc.title,
          category: rc.type as DestinationDto['category'],
          region: rc.region,
          imageUrl: rc.imageUrl,
        };
      }
    }
    if (!seed) return new HttpResponse(null, { status: 404 });

    // id 기반 deterministic hash → 같은 id 면 항상 같은 mock 메타
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
    const u = (n: number) => (Math.abs(h + n) % 1000) / 1000; // 0~1

    // mock images — deterministic SVG data URL 3장 (id 기반 hue 변동).
    // CSP `img-src: 'self' data: blob:` 에 data: 허용되어 있음.
    // 실 BE 는 CDN URL.
    const baseHue = Math.floor(u(70) * 360);
    const images = [0, 1, 2].map((i) => {
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

    const admissionPool = [
      '무료',
      '성인 5,000원',
      '성인 3,000원 / 청소년 2,000원',
    ];
    // Spring DestinationDetailDto shape (GET /destinations/{id}):
    //   id·name·category·region·imageUrl·images[]·address?·type?·admissionFee?·
    //   description?·tags[]·eventStart?·eventEnd? (coords/phone/website/openingHours/
    //   restDate/parking 는 Spring 미제공 — mock 에서도 제외).
    const detail = {
      ...seed,
      description: `${seed.name} — ${seed.region} 대표 ${seed.category}`,
      images,
      address: `충북 ${seed.region.replace(/[a-z]+/i, '')} ${seed.name} 일대`,
      type: seed.category,
      admissionFee:
        u(10) > 0.3
          ? (admissionPool[Math.floor(u(11) * admissionPool.length)] ??
            undefined)
          : undefined,
      tags: [`#${seed.region}`, `#${seed.category}`],
      // festival 일정 — category === 'festival' 일 때만 deterministic mock 일자.
      ...(seed.category === 'festival' && {
        eventStart: mockFestivalDate(h, 0),
        eventEnd: mockFestivalDate(h, 30 + Math.floor(u(70) * 60)),
      }),
    };
    return HttpResponse.json(detail);
  }),

  // ===== Notifications ===== (모두 로그인 필요)
  // cursor 기반 페이지네이션 — 편지/시군콘텐츠와 동일 컨벤션.
  // unreadCount 는 매 페이지 응답에 포함 (전체 통합 수). badge 는 별도 unread-count endpoint.
  // 신규 Spring BE: ApiResponse<UnreadCountDto> 엔벨로프.
  http.get(`${apiUrl}/notifications/unread-count`, () => {
    if (!getMockSignedIn()) return unauthorized();
    return HttpResponse.json({
      success: true,
      message: null,
      data: { unreadCount: notificationItems.filter((n) => !n.read).length },
    });
  }),
  // 신규 Spring BE: ApiResponse<NotificationListDto> 엔벨로프. 페이지 크기 param 은 `size`.
  http.get(`${apiUrl}/notifications`, ({ request }) => {
    if (!getMockSignedIn()) return unauthorized();
    const url = new URL(request.url);
    const cursor = Math.max(0, Number(url.searchParams.get('cursor')) || 0);
    const size = Math.min(
      60,
      Math.max(1, Number(url.searchParams.get('size')) || 20),
    );
    const slice = notificationItems.slice(cursor, cursor + size);
    const next = cursor + slice.length;
    const nextCursor = next < notificationItems.length ? next : null;
    return HttpResponse.json({
      success: true,
      message: null,
      data: {
        items: slice,
        unreadCount: notificationItems.filter((n) => !n.read).length,
        nextCursor,
      },
    });
  }),
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
  // VAPID 공개키 — 구독 생성용. 실 서버는 서버 보유 keypair 의 공개키 반환.
  http.get(`${apiUrl}/notifications/vapid-public-key`, () =>
    HttpResponse.json({
      success: true,
      message: null,
      data: { publicKey: 'BMockVapidPublicKey_e2e_only_000000000000' },
    }),
  ),
  // 등록된 구독 기기 목록.
  http.get(`${apiUrl}/notifications/subscriptions`, () =>
    getMockSignedIn()
      ? HttpResponse.json({
          success: true,
          message: null,
          data: [
            {
              id: 1,
              userAgent: 'Chrome · macOS',
              createdAt: '2026-07-20T09:00:00Z',
            },
            {
              id: 2,
              userAgent: 'Safari · iPhone',
              createdAt: '2026-07-28T12:30:00Z',
            },
          ],
        })
      : unauthorized(),
  ),
  // 특정 기기 구독 해제.
  http.delete(`${apiUrl}/notifications/subscriptions/:id`, () =>
    getMockSignedIn()
      ? new HttpResponse(null, { status: 204 })
      : unauthorized(),
  ),
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
  // 신규 Spring BE: ApiResponse<QuizDto> 엔벨로프 (id: number).
  http.get(`${apiUrl}/travel-types/quiz`, () =>
    HttpResponse.json({
      success: true,
      message: null,
      data: travelTypeQuizSeed,
    }),
  ),
  // 신규 Spring BE: 응답은 TravelTypeResultDto(code/title/emoji/description/tags) 엔벨로프.
  // 내 유형 코드 저장 → GET /me.travelType 이 반환(4-A: travel-types/me 대체).
  http.post(`${apiUrl}/travel-types/submit`, async ({ request }) => {
    const body = (await request.json()) as { answers: TravelTypeAnswer[] };
    const result = resolveTravelType(body.answers ?? []);
    myTravelTypeCode = result.code as TravelTypeMockCode;
    return HttpResponse.json({
      success: true,
      message: null,
      data: {
        code: result.code,
        title: result.title,
        emoji: result.emoji,
        description: result.description,
        tags: result.tags,
      },
    });
  }),
];
