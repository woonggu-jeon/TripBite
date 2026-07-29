import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DestinationDto } from '@/api/generated/schemas';
import { nextPow2, pairRound, roundLabelKey } from './bracket';

function makeDest(id: number): DestinationDto {
  return {
    id: `d-${id}`,
    name: `dest-${id}`,
    category: 'attraction',
    region: 'cheongju',
    imageUrl: undefined,
  };
}

const SEED = [1, 2, 3, 4, 5, 6, 7, 8].map(makeDest);

describe('bracket — pairRound', () => {
  beforeEach(() => {
    // Math.random 을 deterministic 시퀀스로 고정 — shuffle 검증용
    let i = 0;
    const sequence = [0.1, 0.3, 0.5, 0.7, 0.9, 0.2, 0.4, 0.6, 0.8];
    vi.spyOn(Math, 'random').mockImplementation(() => {
      const v = sequence[i % sequence.length] ?? 0.5;
      i += 1;
      return v;
    });
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('8명 → 4 매치 + bye=null', () => {
    const r = pairRound(SEED);
    expect(r.matches).toHaveLength(4);
    expect(r.bye).toBeNull();
  });

  it('7명 → 3 매치 + bye 1명 (홀수)', () => {
    const r = pairRound(SEED.slice(0, 7));
    expect(r.matches).toHaveLength(3);
    expect(r.bye).not.toBeNull();
  });

  it('각 매치의 a/b 는 distinct + 모든 dest 가 한 번씩 등장 (bye 제외)', () => {
    const r = pairRound(SEED);
    const ids = new Set<string>();
    for (const m of r.matches) {
      expect(m.a.id).not.toBe(m.b.id);
      ids.add(m.a.id);
      ids.add(m.b.id);
    }
    expect(ids.size).toBe(8);
  });

  it('동일 input + 동일 random seed → 동일 매치 페어링 (deterministic 검증)', () => {
    const r1 = pairRound(SEED);
    // mock 재설정 — random sequence 동일하게
    vi.restoreAllMocks();
    let i = 0;
    const sequence = [0.1, 0.3, 0.5, 0.7, 0.9, 0.2, 0.4, 0.6, 0.8];
    vi.spyOn(Math, 'random').mockImplementation(() => {
      const v = sequence[i % sequence.length] ?? 0.5;
      i += 1;
      return v;
    });
    const r2 = pairRound(SEED);
    expect(r2.matches.map((m) => [m.a.id, m.b.id])).toEqual(
      r1.matches.map((m) => [m.a.id, m.b.id]),
    );
  });

  it('2명 → 1 매치, winner 미결정', () => {
    const r = pairRound(SEED.slice(0, 2));
    expect(r.matches).toHaveLength(1);
    expect(r.bye).toBeNull();
    expect(r.matches[0]?.winner).toBeUndefined();
  });
});

describe('bracket — nextPow2', () => {
  it.each([
    [1, 1],
    [2, 2],
    [3, 4],
    [4, 4],
    [5, 8],
    [8, 8],
    [9, 16],
    [16, 16],
    [17, 32],
  ])('nextPow2(%i) = %i', (input, expected) => {
    expect(nextPow2(input)).toBe(expected);
  });
});

describe('bracket — roundLabelKey', () => {
  it.each<[number, 'final' | 'semifinal' | 'quarterfinal' | 'roundOfN']>([
    [2, 'final'],
    [3, 'semifinal'],
    [4, 'semifinal'],
    [5, 'quarterfinal'],
    [8, 'quarterfinal'],
    [9, 'roundOfN'],
    [16, 'roundOfN'],
    [32, 'roundOfN'],
  ])('participants=%i → %s', (n, kind) => {
    const r = roundLabelKey(n);
    expect(r.kind).toBe(kind);
  });

  it('roundOfN 의 n 은 nextPow2(participants) 와 일치', () => {
    expect(roundLabelKey(16)).toEqual({ kind: 'roundOfN', n: 16 });
    expect(roundLabelKey(9)).toEqual({ kind: 'roundOfN', n: 16 });
    expect(roundLabelKey(32)).toEqual({ kind: 'roundOfN', n: 32 });
  });
});
