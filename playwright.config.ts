import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 설정
 *
 * 실행:
 *   npm run test:e2e         헤드리스 전체
 *   npm run test:e2e:ui      UI 모드 (디버깅)
 *
 * 사전 1회 (브라우저 바이너리 설치, ~수백 MB):
 *   npx playwright install --with-deps chromium
 *
 * 동작:
 *   - webServer가 빌드+start를 자동 기동 (CI에서도)
 *   - NEXT_PUBLIC_USE_MSW=true 로 MSW mock 응답 사용 → 백엔드 불필요
 *   - 모바일 뷰포트 프리셋 (이 앱은 모바일 우선 PWA)
 *
 * MSW 공유:
 *   vitest와 동일한 src/mocks/handlers.ts 를 dev 서버의 service worker가 사용.
 *   별도 globalSetup 없이 앱 자체 MSW 토글로 mock 활성화.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 14'] } },
  ],
  webServer: {
    command: 'npm run build && npm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_API_URL: 'http://localhost:8080',
      NEXT_PUBLIC_USE_MSW: 'true',
    },
  },
});
