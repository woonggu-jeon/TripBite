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
    // middleware 가 두 분기로 redirect:
    //   1) tripbite.visited cookie 없음 → /onboarding (먼저 발동, public 경로 / 도 해당)
    //   2) SID cookie 없음 + 보호 경로 → /login
    // 본 test 는 / 진입이라 1)번 분기 적용 → /onboarding. (운영/mock 환경 동일)
    // 두 경로 모두 허용 — 구현 변경 시 안전망.
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
