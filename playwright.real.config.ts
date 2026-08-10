import { defineConfig, devices } from '@playwright/test';

/**
 * 실 BE(Spring) 대상 e2e 스모크 — mock 이 아니라 **실제 프로덕션 백엔드** 응답으로
 * 화면을 검증. mock e2e 가 못 잡는 "실 BE 에서만 비는 화면/degrade" 클래스를 방어.
 *
 * 실행: `npm run test:e2e:real` (네트워크 + 실 BE 필요, 기본 test:e2e 에는 미포함).
 *
 * 동작:
 *   - webServer 가 build + start 를 포트 3000 에 기동 (USE_MSW=false).
 *   - API 는 same-origin 프록시(`/api/backend/*` → next rewrite → 실 Spring).
 *     따라서 브라우저는 localhost:3000 과만 통신 → JSESSIONID/marker 쿠키 정상.
 *   - 로그인은 실제 test 계정으로 UI 로그인(실 세션 발급 흐름까지 검증).
 *
 * 데이터가 실시간이라 exact 값 대신 "렌더 성공 · 예외 0 · 핵심 위젯 비어있지 않음 ·
 * 헤더 h1 ≤ 1" 같은 견고한 불변식만 단정.
 */
const BE = process.env.BE_ORIGIN ?? 'https://trip-bite.o-r.kr';

export default defineConfig({
  testDir: './e2e-real',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'line',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    ...devices['Desktop Chrome'],
    viewport: { width: 1280, height: 800 },
  },
  webServer: {
    command: 'npm run build && npx next start --port 3000',
    url: 'http://localhost:3000',
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      // 실 BE 로 프록시 — MSW 끔.
      NEXT_PUBLIC_USE_MSW: 'false',
      NEXT_PUBLIC_API_URL: BE,
      NEXT_PUBLIC_AUTH_COOKIE: 'tripbite.authed',
    },
  },
});
