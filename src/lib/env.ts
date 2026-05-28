import { z } from 'zod';

/**
 * 환경변수 type-safe 검증 + 단일 출처
 *
 * 사용:
 *   import { env, assertRequiredEnv } from '@/lib/env';
 *   const apiUrl = env.NEXT_PUBLIC_API_URL;   // string | undefined (검증됨)
 *
 * 정책:
 *   - NEXT_PUBLIC_*만 검증 (서버 전용은 server-only 모듈에서 별도)
 *   - 미설정은 optional로 허용, 실제 필수 체크는 assertRequiredEnv()
 *   - schema 위반(타입 mismatch 등) 발견 시 콘솔 경고만 — 빌드는 깨뜨리지 않음
 *
 * 신규 코드는 process.env 직접 접근 대신 `env.*` 사용 권장 (오타·누락 컴파일 안전).
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().optional(),
  NEXT_PUBLIC_USE_MSW: z.enum(['true', 'false']).optional(),
  NEXT_PUBLIC_APP_VERSION: z.string().optional(),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().optional(),
});

const parsed = clientEnvSchema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_USE_MSW: process.env.NEXT_PUBLIC_USE_MSW,
  NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});

if (!parsed.success && process.env.NODE_ENV !== 'test') {
  console.error(
    '[env] schema invalid — 기본값 fallback:',
    parsed.error.flatten().fieldErrors,
  );
}

export const env: Partial<z.infer<typeof clientEnvSchema>> = parsed.success
  ? parsed.data
  : {};

/**
 * 부팅 시점에 호출 — 필수 env 미설정 시 콘솔 경고 (services/api/client.ts에서 호출).
 * MSW 모드/테스트 환경은 면제.
 */
export function assertRequiredEnv(): void {
  if (process.env.NODE_ENV === 'test') return;
  if (env.NEXT_PUBLIC_USE_MSW === 'true') return;

  if (!env.NEXT_PUBLIC_API_URL) {
    console.error(
      '[env] NEXT_PUBLIC_API_URL 미설정 — 백엔드 API 호출이 모두 실패합니다. ' +
        '.env.local 또는 Vercel 환경변수를 확인하세요.',
    );
  }
}
