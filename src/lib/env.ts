/**
 * 필수 환경변수 런타임 가드
 *
 * NEXT_PUBLIC_API_URL 미설정 시 axios baseURL이 undefined → 모든 API 조용히 실패.
 * 부팅 시점에 명시적으로 경고/실패시켜 운영 사고를 빠르게 발견.
 *
 * - MSW 모드(NEXT_PUBLIC_USE_MSW=true)는 same-origin proxy라 API_URL 불필요 → 면제
 * - test 환경(vitest)도 면제
 */
export function assertRequiredEnv(): void {
  if (process.env.NODE_ENV === 'test') return;
  if (process.env.NEXT_PUBLIC_USE_MSW === 'true') return;

  if (!process.env.NEXT_PUBLIC_API_URL) {
    const msg =
      '[env] NEXT_PUBLIC_API_URL 미설정 — 백엔드 API 호출이 모두 실패합니다. ' +
      '.env.local 또는 Vercel 환경변수를 확인하세요.';

    console.error(msg);
  }
}
