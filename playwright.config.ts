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
 *   - webServer가 빌드+start를 포트 3000 에 자동 기동 (dev/preview 와 동일 포트)
 *   - NEXT_PUBLIC_USE_MSW=true 로 MSW mock 응답 사용 → 백엔드 불필요·결정적
 *   - 모바일 뷰포트 프리셋 (이 앱은 모바일 우선 PWA)
 *
 * ⚠️ dev 서버(`npm run dev`, USE_MSW=false)와 포트 3000 을 공유한다. e2e 는 항상
 *    자체 MSW 서버를 띄우므로(reuseExistingServer:false), 실행 전에 dev 를 종료할 것
 *    (`npm run kill:3000`). 안 그러면 포트 충돌로 webServer 기동 실패.
 *
 * MSW 공유:
 *   vitest와 동일한 src/mocks/handlers.ts 를 dev 서버의 service worker가 사용.
 *   별도 globalSetup 없이 앱 자체 MSW 토글로 mock 활성화.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // 로컬도 1회 재시도 — hydration/애니메이션 타이밍 flake 흡수(결정적 실패는 그대로 노출).
  retries: process.env.CI ? 2 : 1,
  // 워커 상한 — 과도한 병렬은 빌드/하이드레이션 경합으로 flake 유발(로컬 관측).
  workers: process.env.CI ? 2 : 3,
  reporter: process.env.CI ? 'github' : 'html',
  // assertion/액션 기본 타임아웃 상향 — 5s 는 하이드레이션 지연에 취약.
  expect: { timeout: 10_000 },
  timeout: 45_000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
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
    command: 'npm run build && npx next start --port 3000',
    url: 'http://localhost:3000',
    // dev(3000, USE_MSW=false)와 포트가 같다 — 재사용하면 e2e 가 MSW 대신 실 Spring
    // 에 붙어 깨진다. 항상 자체 MSW 서버를 띄운다 (실행 전 `npm run dev` 는 종료할 것).
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_API_URL: 'http://localhost:8080',
      NEXT_PUBLIC_USE_MSW: 'true',
    },
  },
});
