import { describe, it, expect, beforeEach } from 'vitest';
import type {
  Destination,
  TournamentConfig,
} from '@/features/tournament/types';
import { useTournamentStore } from './tournament-store';

function makeDest(id: number, name = `dest-${id}`): Destination {
  return {
    id: `d-${id}`,
    name,
    category: 'attraction',
    region: 'cheongju',
    imageUrl: undefined,
  };
}

const BASE_CONFIG: TournamentConfig = {
  theme: { kind: 'season', value: 'spring' },
  categories: ['festival'],
  region: undefined,
  count: 8,
  tournamentSize: undefined,
};

describe('tournament-store', () => {
  beforeEach(() => {
    useTournamentStore.getState().reset();
    // sessionStorage clear — persist 잔재 제거
    sessionStorage.clear();
  });

  it('초기 상태는 빈 값', () => {
    const s = useTournamentStore.getState();
    expect(s.config).toBeNull();
    expect(s.winner).toBeNull();
    expect(s.runnerUp).toBeNull();
    expect(s.matchesPlayed).toBe(0);
  });

  it('setConfig 후 config 반영', () => {
    useTournamentStore.getState().setConfig(BASE_CONFIG);
    expect(useTournamentStore.getState().config).toEqual(BASE_CONFIG);
  });

  it('setTournamentSize — config 가 있을 때만 갱신', () => {
    // config 없을 때 호출해도 안전
    useTournamentStore.getState().setTournamentSize(4);
    expect(useTournamentStore.getState().config).toBeNull();

    // config 설정 후 갱신
    useTournamentStore.getState().setConfig(BASE_CONFIG);
    useTournamentStore.getState().setTournamentSize(4);
    expect(useTournamentStore.getState().config?.tournamentSize).toBe(4);
  });

  it('setBracketResult — winner/runnerUp/matchesPlayed 일괄 저장', () => {
    const w = makeDest(1);
    const r = makeDest(2);
    useTournamentStore.getState().setBracketResult({
      winner: w,
      runnerUp: r,
      matchesPlayed: 7,
    });
    const s = useTournamentStore.getState();
    expect(s.winner).toEqual(w);
    expect(s.runnerUp).toEqual(r);
    expect(s.matchesPlayed).toBe(7);
  });

  it('reset — 전체 초기화', () => {
    useTournamentStore.getState().setConfig(BASE_CONFIG);
    useTournamentStore.getState().setWinner(makeDest(1));
    useTournamentStore.getState().reset();
    const s = useTournamentStore.getState();
    expect(s.config).toBeNull();
    expect(s.winner).toBeNull();
    expect(s.matchesPlayed).toBe(0);
  });

  it('sessionStorage persist — set 후 raw 키에 직렬화 저장', () => {
    useTournamentStore.getState().setConfig(BASE_CONFIG);
    useTournamentStore.getState().setBracketResult({
      winner: makeDest(1),
      runnerUp: makeDest(2),
      matchesPlayed: 3,
    });
    const raw = sessionStorage.getItem('tournament');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    // zustand persist 포맷: { state: {...}, version: 0 }
    expect(parsed.state.config).toEqual(BASE_CONFIG);
    expect(parsed.state.winner?.id).toBe('d-1');
    expect(parsed.state.matchesPlayed).toBe(3);
  });

  it('partialize — 액션 함수는 sessionStorage 에 안 들어감', () => {
    useTournamentStore.getState().setConfig(BASE_CONFIG);
    const raw = sessionStorage.getItem('tournament');
    const parsed = JSON.parse(raw!);
    expect(parsed.state.setConfig).toBeUndefined();
    expect(parsed.state.reset).toBeUndefined();
  });
});
