/**
 * /tournament/result fallback — bracket finish → result navigation 또는
 * cold start (deep-link / reload) 사이 잠시 보이는 fallback. SubHeader/
 * skeleton 그림 자체가 시각 노이즈 (사용자 명시 2026-06-25 반복 보고).
 * null 반환 → Next.js 가 fallback 미표시. 클라이언트 mount 후 즉시 실제
 * content 또는 SeasonLoadingPanel (TournamentResultClient 내부) 로 전환.
 */
export default function TournamentResultLoading() {
  return null;
}
