import { test, expect } from '@playwright/test';

/**
 * Smoke 테스트 — 인프라 동작 확인용 기준점
 *
 * 셀렉터 의존을 최소화해 UI 변경에 강함.
 * 실제 시나리오(온보딩/편지/위치)는 별도 spec으로 확장:
 *   e2e/auth.spec.ts, e2e/tournament.spec.ts, e2e/letter.spec.ts 등
 */
test.describe('smoke', () => {
  test('미인증 사용자는 /login 또는 /onboarding 으로 리다이렉트', async ({
    page,
  }) => {
    // middleware 의 인증 redirect 는 현재 운영 전이라 주석 처리됨 — AuthBootstrap
    // 의 localStorage(tripbite.onboarded) 기반 redirect 만 동작.
    // localStorage 없음 → /onboarding. 운영 전환(middleware 주석 해제) 후엔 /login.
    await page.goto('/');
    await expect(page).toHaveURL(/\/(login|onboarding)/);
  });

  test('/login 페이지가 정상 로드', async ({ page }) => {
    const res = await page.goto('/login');
    expect(res?.status()).toBeLessThan(400);
  });

  test('/api/health가 ok 반환', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});
