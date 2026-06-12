import type { BrowserContext, Page } from '@playwright/test';

/**
 * E2E 인증 헬퍼.
 *
 * middleware (SSR) 의 두 redirect 분기 모두 우회:
 *   1) 보호 경로 + SID cookie 없음 → /login redirect
 *      → SID mock cookie 주입으로 통과
 *   2) tripbite.visited cookie 없음 → /onboarding redirect
 *      → visited cookie 주입으로 통과
 *
 * E2E 는 MSW 모드 (NEXT_PUBLIC_USE_MSW=true). mock handler 가 SID 값 검증 없이
 * mockUser 반환 — cookie 값 자체는 무의미.
 *
 * push prompt 도 미리 dismiss 해 banner 노이즈 회피.
 */

const MOCK_SID = 'e2e-mock-sid';
const E2E_BASE_URL = 'http://localhost:3901';

export async function injectAuthCookie(context: BrowserContext) {
  await context.addCookies([
    {
      name: 'SID',
      value: MOCK_SID,
      url: E2E_BASE_URL,
    },
    {
      name: 'tripbite.visited',
      value: '1',
      url: E2E_BASE_URL,
    },
  ]);
}

export async function bypassOnboarding(page: Page) {
  // visited cookie 는 injectAuthCookie 가 처리 (middleware SSR redirect 차단용).
  // 본 함수는 push prompt 등 in-page UI 잡음 제거만 담당.
  await page.addInitScript(() => {
    try {
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
