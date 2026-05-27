import { test, expect } from '@playwright/test';

/**
 * Smoke 테스트 — 인프라 동작 확인용 기준점
 *
 * 셀렉터 의존을 최소화해 UI 변경에 강함.
 * 실제 시나리오(온보딩/편지/위치)는 별도 spec으로 확장:
 *   e2e/auth.spec.ts, e2e/tournament.spec.ts, e2e/letter.spec.ts 등
 */
test.describe('smoke', () => {
  test('미인증 사용자는 /login으로 리다이렉트', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
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
