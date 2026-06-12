import { NextResponse } from 'next/server';

/**
 * 클라이언트 에러 수집 엔드포인트 (운영 observability 최소선).
 *
 * Sentry 등 별도 SaaS 미도입 환경에서 클라이언트 crash 가시성 0 회귀 대응.
 * 운영 빌드에서만 활성 — dev / mock 환경은 console 로 충분.
 *
 * 발신측: `src/lib/client-error-reporter.ts` 가 다음 4 경로에서 호출
 *   1) window.onerror               (script 미처리 error)
 *   2) window.onunhandledrejection  (Promise reject)
 *   3) error.tsx 의 useEffect       (Next.js error boundary)
 *   4) react-query queryCache.onError (network/API 분리)
 *
 * Payload 예 (PII 미포함):
 *   { source, message, stack, url, ua, ts, digest? }
 *
 * 운영 저장: console 만 (Vercel logs). Sentry 도입 시 본 endpoint → forward 만 추가.
 */
export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // PII 가 들어갈 가능성 있는 필드는 발신측이 제외 — endpoint 는 받은 그대로 로그.
    // 운영자가 Vercel logs 에서 `[client-error]` 로 grep.
    console.error('[client-error]', JSON.stringify(body));
  } catch {
    // 파싱 실패 무시 — 보고 수집은 best-effort
  }
  return new NextResponse(null, { status: 204 });
}
