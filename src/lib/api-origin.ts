/**
 * `NEXT_PUBLIC_API_URL` 에서 origin (scheme + host + port) 만 추출.
 *
 * BE 가 NestJS versioning 으로 `/v1` prefix 를 사용해 환경변수 값이
 * `http://localhost:3000/v1` 같은 path 포함 형태일 수 있다. 다음 두 곳은
 * **origin 만** 받아야 하므로 본 helper 로 정규화 필요:
 *
 *   1) CSP `connect-src` (lib/csp.ts) — path 포함 시 host-source 파싱 실패
 *      → 해당 origin 의 fetch 가 CSP block.
 *   2) `<link rel="preconnect">` (app/layout.tsx) — path 포함 시 무효
 *      → DNS/TLS preconnect 안 잡혀 첫 호출 지연.
 *
 * URL 파싱 실패 시 안전하게 빈 문자열 반환.
 */
export function getApiOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (!raw) return '';
  try {
    return new URL(raw).origin;
  } catch {
    return '';
  }
}
