import { test, expect, type Page } from '@playwright/test';

/**
 * Onboarding first-visit redirect — middleware `tripbite.visited` cookie 기반.
 *
 * 시나리오:
 *   1) cookie 없는 새 사용자 → / 진입 → /onboarding 으로 SSR redirect (next 없음)
 *   2) cookie 없음 + deep-link (/region/cheongju 등) → /onboarding?next=... 로 redirect
 *   3) cookie 있음 → 그대로 진입 (no redirect)
 *   4) cookie 있음 + /onboarding 직접 진입 → / 로 server redirect
 *   5) skip 경로 (/login, /signup, /policy/*) 는 cookie 없어도 진입 허용
 */

async function clearVisitedCookie(page: Page) {
  // beforeEach 마다 cookie 비움 — 새 사용자 시뮬레이션
  await page.context().clearCookies();
}

async function setVisitedCookie(page: Page) {
  await page.context().addCookies([
    {
      name: 'tripbite.visited',
      value: '1',
      url: page.url() || 'http://localhost:3000',
      sameSite: 'Lax',
    },
  ]);
}

test.describe('Onboarding redirect — middleware', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(
      !testInfo.project.name.startsWith('desktop'),
      'middleware redirect 는 desktop 계열에서만 검증 (mobile 동일 동작)',
    );
    await clearVisitedCookie(page);
  });

  test('cookie 없음 + / 진입 → /onboarding (next 없음)', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/onboarding(\?|$)/);
    // next query 없음 (홈은 default 라 보존 X)
    expect(page.url()).not.toContain('next=');
  });

  test('cookie 없음 + deep-link → /onboarding?next=... 보존', async ({
    page,
  }) => {
    await page.goto('/region/cheongju');
    await expect(page).toHaveURL(/\/onboarding\?next=/);
    expect(page.url()).toContain('next=%2Fregion%2Fcheongju');
  });

  test('cookie 있음 + / 진입 → 그대로 (no redirect)', async ({
    page,
    context,
  }) => {
    await context.addCookies([
      {
        name: 'tripbite.visited',
        value: '1',
        domain: 'localhost',
        path: '/',
        sameSite: 'Lax',
      },
    ]);
    await page.goto('/');
    await expect(page).toHaveURL(/\/(\?.*)?$/);
  });

  test('cookie 있음 + /onboarding 직접 진입 → / 로 redirect', async ({
    page,
    context,
  }) => {
    await context.addCookies([
      {
        name: 'tripbite.visited',
        value: '1',
        domain: 'localhost',
        path: '/',
        sameSite: 'Lax',
      },
    ]);
    await page.goto('/onboarding');
    await expect(page).toHaveURL(/\/(\?.*)?$/);
  });

  test('skip 경로 (/login) 는 cookie 없어도 진입', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);
  });

  test('skip 경로 (/policy/terms) 는 cookie 없어도 진입', async ({ page }) => {
    await page.goto('/policy/terms');
    await expect(page).toHaveURL(/\/policy\/terms/);
  });
});
