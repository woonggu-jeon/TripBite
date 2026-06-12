import type { DestinationDto } from '@/api/generated/schemas';

/**
 * 토너먼트 트리 유틸 (단일 라운드 페어링 + 라운드 사이즈 결정)
 *
 * 라운드 단위 진행:
 *   - 짝수 참가자 → N/2 매치
 *   - 홀수 참가자 → (N-1)/2 매치 + 1명 부전승(bye, 다음 라운드 자동 진출)
 *
 * Bracket 컴포넌트가 라운드마다 pairRound 를 호출해 다음 라운드를 생성.
 */

export type BracketMatch = {
  id: string;
  a: DestinationDto;
  b: DestinationDto;
  winner?: DestinationDto;
};

export type RoundState = {
  /** 이 라운드 시작 시점의 참가자 */
  participants: DestinationDto[];
  matches: BracketMatch[];
  /** 부전승 (다음 라운드 자동 진출). 짝수 참가자면 null */
  bye: DestinationDto | null;
};

function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const ai = a[i] as T;
    const aj = a[j] as T;
    a[i] = aj;
    a[j] = ai;
  }
  return a;
}

export function pairRound(participants: DestinationDto[]): RoundState {
  const shuffled = shuffle(participants);
  const matches: BracketMatch[] = [];
  let bye: DestinationDto | null = null;

  let start = 0;
  if (shuffled.length % 2 === 1) {
    bye = shuffled[0] ?? null;
    start = 1;
  }

  for (let i = start; i < shuffled.length; i += 2) {
    const a = shuffled[i];
    const b = shuffled[i + 1];
    if (a && b) {
      matches.push({ id: `m-${i}`, a, b });
    }
  }

  return { participants, matches, bye };
}

/** 다음 2의 제곱수 (라운드 라벨 결정용) */
export function nextPow2(n: number): number {
  if (n <= 1) return 1;
  return 2 ** Math.ceil(Math.log2(n));
}

/**
 * 라운드 라벨 키 결정 — i18n key 반환.
 *   participants <=2 : final
 *   participants <=4 : semifinal
 *   participants <=8 : quarterfinal
 *   그 외           : roundOfN (n = nextPow2)
 */
export type RoundLabelKey =
  | { kind: 'final' }
  | { kind: 'semifinal' }
  | { kind: 'quarterfinal' }
  | { kind: 'roundOfN'; n: number };

export function roundLabelKey(participants: number): RoundLabelKey {
  const size = nextPow2(participants);
  if (size <= 2) return { kind: 'final' };
  if (size <= 4) return { kind: 'semifinal' };
  if (size <= 8) return { kind: 'quarterfinal' };
  return { kind: 'roundOfN', n: size };
}
