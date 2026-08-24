/**
 * Fisher-Yates 셔플 (in-place 가 아닌 새 배열 반환).
 *
 * ⚠️ Math.random 사용 — 서버/클라 결과가 달라 hydration mismatch 발생.
 * 반드시 client side (useEffect 안 등) 에서 호출 후 state 에 캐싱할 것.
 *
 * 도메인 무관 제네릭 유틸 — 랭킹 퀴즈 옵션 셔플(`shuffleQuizOptions`)과 토너먼트
 * 페어링(`bracket.pairRound`)이 공유. (이전엔 두 곳에 동일 구현이 복붙돼 있었음.)
 */
export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i] as T;
    a[i] = a[j] as T;
    a[j] = tmp;
  }
  return a;
}
