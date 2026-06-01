import type { BrowserContext, Page } from '@playwright/test';

/**
 * E2E 인증 헬퍼.
 *
 * - middleware.ts 가 access_token 쿠키 없는 요청을 /login 으로 redirect.
 *   E2E 는 MSW 모드 (NEXT_PUBLIC_USE_MSW=true) 라 실 인증 endpoint 가 mock 으로
 *   mockUser 를 반환 — middleware 우회 위해 mock token 쿠키 주입.
 *
 * - localStorage 의 onboarded 도 사전 set 해 AuthBootstrap 의 /onboarding redirect 차단.
 *   push prompt 도 미리 dismiss 해 banner 노이즈 회피.
 */

const MOCK_ACCESS_TOKEN = 'e2e-mock-access-token';

export async function injectAuthCookie(context: BrowserContext) {
  await context.addCookies([
    {
      name: 'access_token',
      value: MOCK_ACCESS_TOKEN,
      url: 'http://localhost:3000',
    },
  ]);
}

export async function bypassOnboarding(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('tripbite.onboarded', 'true');
      localStorage.setItem('tripbite.push-prompt.dismissed', 'true');
    } catch {
      // ignore (Safari private 등)
    }
  });
}

/** 인증 + 온보딩 우회 — 일반 페이지 smoke 의 기본값 */
export async function authedSession(page: Page) {
  await injectAuthCookie(page.context());
  await bypassOnboarding(page);
}
