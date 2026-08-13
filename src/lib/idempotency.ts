/**
 * Idempotency-Key 생성 — mutate 1회 = UUID 1개.
 *
 * BE 합의(편지 compose 2026-06-23 / 토너먼트 record 2026-06-19): 24h 내 같은 키 =
 * BE 가 동일 결과 반환 → 네트워크 재시도·더블 submit 시 중복 생성 방지. 헤더로 전달.
 *
 * `crypto.randomUUID` 미지원(구형/비-secure context) 환경에선 `undefined` 반환 —
 * 이 경우 BE 는 dedup 없이 정상 처리(헤더 미첨부). 호출처: `useSendLetter`,
 * `useRecordTournament`.
 */
export function newIdempotencyKey(): string | undefined {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : undefined;
}
