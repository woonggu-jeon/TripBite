/**
 * 환경 변수 타입 선언
 *
 * 규칙:
 *   - NEXT_PUBLIC_* : 브라우저 번들에 그대로 포함됨 — 절대 비밀 X
 *   - 나머지: server-only (Node.js / Server Component / Route Handler 에서만)
 *
 * 사용:
 *   process.env.NEXT_PUBLIC_API_URL  → 타입 추론 + 자동완성
 *
 * 누락된 변수 사용은 string | undefined 로 추론되어 컴파일 단계에서 잡힘.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface ProcessEnv {
      // === Public (브라우저 노출 OK) ===
      NEXT_PUBLIC_API_URL: string;
      NEXT_PUBLIC_VAPID_PUBLIC_KEY?: string;
      NEXT_PUBLIC_SENTRY_DSN?: string;

      // === Server-only (절대 NEXT_PUBLIC_ 붙이지 말 것) ===
      VAPID_PRIVATE_KEY?: string;
      SENTRY_AUTH_TOKEN?: string;
      OPENAPI_URL?: string;

      // Next.js 빌트인
      NODE_ENV: 'development' | 'production' | 'test';
    }
  }
}

export {};
