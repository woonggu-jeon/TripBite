// @vitest-environment node
// (node 환경 필수 — happy-dom 은 브라우저처럼 Set-Cookie 를 JS 에서 숨겨 세션 주입 불가)
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { authApi } from '@/features/auth/api/auth';
import { letterApi } from '@/features/letter/api/letter';
import { mypageApi } from '@/features/mypage/api/mypage';
import { rankingApi } from '@/features/ranking/api/ranking';
import { regionApi } from '@/features/region/api/region';
import { tournamentApi } from '@/features/tournament/api/tournament';
import type { TournamentConfig } from '@/features/tournament/types';
import { server } from '@/mocks/server';
import { api } from '@/services/api/client';

/**
 * 실 BE contract 테스트 — **mock(MSW) 이 아니라 실제 Spring BE 응답**으로 어댑터 매핑 검증.
 *
 * 실행 (네트워크 + 테스트 계정 필요, 평소 오프라인 유닛 스위트에선 skip):
 *   BE_CONTRACT=1 npm run test:run -- src/api/be-contract.test.ts
 *   (or: npm run be:contract)
 *
 * env:
 *   BE_CONTRACT=1        활성화 (없으면 describe.skip)
 *   BE_ORIGIN            기본 https://trip-bite.o-r.kr
 *   BE_TEST_USER/PASS    기본 test / 1234
 *
 * 동작: MSW server.close() 로 실제 네트워크 통과 → api(axios) baseURL 을 실 BE 로 교체
 *       → 로그인해 JSESSIONID 를 Cookie 헤더로 주입 → 실제 어댑터 함수 호출.
 */
const RUN = process.env.BE_CONTRACT === '1';
const BE = process.env.BE_ORIGIN ?? 'https://trip-bite.o-r.kr';
const USER = process.env.BE_TEST_USER ?? 'test';
const PASS = process.env.BE_TEST_PASS ?? '1234';

const d = RUN ? describe : describe.skip;

d('실 BE contract — 어댑터 ↔ 실제 응답 (mock 아님)', () => {
  beforeAll(async () => {
    server.close(); // MSW 중지 → 실 네트워크 통과
    api.defaults.baseURL = BE;
    api.defaults.headers.common['User-Agent'] = 'tripbite-contract-test';

    const res = await api.post('/auth/login', {
      username: USER,
      password: PASS,
    });
    // login contract: ApiResponse<LoginResponseDto> = { data: { userId:number } }
    expect(res.data?.success).toBe(true);
    expect(typeof res.data?.data?.userId).toBe('number');

    const setCookie = res.headers['set-cookie'] as string[] | undefined;
    const jsession = setCookie?.find((c) => c.startsWith('JSESSIONID'));
    expect(jsession, 'JSESSIONID 쿠키 발급').toBeTruthy();
    api.defaults.headers.common['Cookie'] = jsession!.split(';')[0];
  }, 30_000);

  afterAll(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* ignore */
    }
  });

  it('authApi.me → UserResponseDto→UserDto (id number→string, nickname 존재)', async () => {
    const u = await authApi.me();
    expect(typeof u.id).toBe('string');
    expect(u.username).toBeTruthy();
    expect(u.nickname).toBeTruthy();
  });

  it('rankingApi.getTravelTypeQuiz → 5문항, id number→string 정규화', async () => {
    const q = await rankingApi.getTravelTypeQuiz();
    expect(q.questions.length).toBeGreaterThan(0);
    const q0 = q.questions[0]!;
    expect(typeof q0.id).toBe('string'); // 신규 BE number → 도메인 string
    expect(q0.options.length).toBeGreaterThan(0);
    expect(typeof q0.options[0]!.id).toBe('string');
  });

  it('rankingApi.list weekly / by-region → RankedDestination[]', async () => {
    const weekly = await rankingApi.list({ type: 'weekly-winners', limit: 5 });
    expect(Array.isArray(weekly)).toBe(true);
    if (weekly.length) {
      expect(typeof weekly[0]!.destination.id).toBe('string');
      expect(typeof weekly[0]!.score).toBe('number');
    }
    const byRegion = await rankingApi.list({ type: 'by-region' });
    expect(Array.isArray(byRegion)).toBe(true);
    if (byRegion.length) {
      expect(byRegion[0]!.destination.region).toBeTruthy();
      expect(typeof byRegion[0]!.score).toBe('number');
    }
  });

  it('regionApi.ongoingFestivals → { type, items }', async () => {
    const r = await regionApi.ongoingFestivals();
    expect(r.type).toBeTruthy();
    expect(Array.isArray(r.items)).toBe(true);
  });

  it('mypageApi.getStamps → { visited: string[], total: number }', async () => {
    const s = await mypageApi.getStamps();
    expect(Array.isArray(s.visited)).toBe(true);
    expect(typeof s.total).toBe('number');
  });

  it('tournamentApi.getDestinationDetail(정수 id) → Spring 필드명(images) 그대로', async () => {
    // 실 BE 목록에서 실제 id 를 가져와 상세 조회 (하드코딩 id 불안정 회피).
    const candidates = await tournamentApi.fetchCandidates({
      theme: { kind: 'season', value: 'spring' },
      categories: ['attraction'],
      selectedRegions: [],
      tournamentSize: 4,
    } as unknown as TournamentConfig);
    expect(Array.isArray(candidates)).toBe(true);
    expect(candidates.length).toBeGreaterThan(0);
    const id = candidates[0]!.id;
    expect(typeof id).toBe('string');

    const detail = await tournamentApi.getDestinationDetail(id);
    expect(typeof detail.id).toBe('string');
    expect(detail.name).toBeTruthy();
    // Spring 필드명(images) 그대로 노출 — 배열.
    expect(Array.isArray(detail.images)).toBe(true);
  });

  it('tournamentApi.listSaved / listHistory → 도메인 shape', async () => {
    const saved = await tournamentApi.listSaved();
    expect(Array.isArray(saved)).toBe(true);
    if (saved.length) {
      expect(typeof saved[0]!.id).toBe('string');
      expect(saved[0]!.luckyColor).toBe(''); // 신규 BE 미제공 → ''
    }
    const history = await tournamentApi.listHistory();
    expect(Array.isArray(history.items)).toBe(true);
    if (history.items.length) {
      expect(typeof history.items[0]!.id).toBe('string');
      expect(typeof history.items[0]!.count).toBe('number'); // ← tournamentSize
    }
  });

  it('letterApi.listReceived → { items, nextCursor }', async () => {
    const page = await letterApi.listReceived(0);
    expect(Array.isArray(page.items)).toBe(true);
    expect(
      page.nextCursor === null || typeof page.nextCursor === 'number',
    ).toBe(true);
  });

  // ── 2026-08 BE 수정 확인 — compose/signup 정상 (계약 변경: isAnonymous + location.regionCode 필수) ──
  it('letterApi.send(compose) 성공 — 편지 생성', async () => {
    const letter = await letterApi.send({
      body: '오늘도맑음',
      location: { label: '청주시', regionCode: 'cheongju' },
      isAnonymous: false,
    } as unknown as Parameters<typeof letterApi.send>[0]);
    expect(typeof letter.id).toBe('string');
    expect(letter.id.length).toBeGreaterThan(0);
    expect(letter.body).toBe('오늘도맑음');
  });

  it('POST /auth/signup 성공(201) — 유효 payload', async () => {
    const uniq = `qa${Date.now().toString().slice(-8)}`; // 영숫자 4-20
    const res = await api.post('/auth/signup', {
      username: uniq,
      password: 'Testpass1234', // 10자↑ 영문+숫자
      name: '계약',
      birthDate: '1999-01-01',
      email: `${uniq}@bite.com`,
      phone: '01011112222',
      nickname: uniq, // 유니크 — 중복 닉네임(409) 회피
    });
    expect(res.status).toBe(201);
  });
});
