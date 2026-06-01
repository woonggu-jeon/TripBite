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
  // 플랫폼 매트릭스 (6종) — 같은 chromium binary 라 OS 별 차이는 font subpixel 수준.
  // userAgent 와 viewport 만 다르므로 desktop-windows / desktop-mac 는 형식적 분리.
  // 운영 검증은 실기기 (iOS Safari 17+, Galaxy S 시리즈) 별도.
  projects: [
    // 데스크탑 Windows
    {
      name: 'desktop-windows',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
    // 데스크탑 Mac
    {
      name: 'desktop-mac',
      use: {
        ...devices['Desktop Chrome'],
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        viewport: { width: 1440, height: 900 },
      },
    },
    // 모바일 웹 (AOS) — Android Chrome
    { name: 'mobile-chrome-aos', use: { ...devices['Pixel 7'] } },
    // 모바일 웹 (iOS) — iOS Safari
    { name: 'mobile-safari-ios', use: { ...devices['iPhone 14'] } },
    // 모바일 앱 (AOS PWA) — Pixel 7 standalone 시뮬
    {
      name: 'mobile-pwa-aos',
      use: {
        ...devices['Pixel 7'],
        contextOptions: { reducedMotion: 'no-preference' },
      },
    },
    // 모바일 앱 (iOS PWA) — iPhone 14 standalone 시뮬
    {
      name: 'mobile-pwa-ios',
      use: {
        ...devices['iPhone 14'],
        contextOptions: { reducedMotion: 'no-preference' },
      },
    },
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
