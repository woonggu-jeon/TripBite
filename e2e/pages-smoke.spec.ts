import { test, expect, type Page } from '@playwright/test';
import { authedSession } from './_helpers/auth';

/**
 * 페이지 자동 QA — 주요 페이지 진입 + 핵심 콘텐츠 확인 + 가로 overflow 검증.
 *
 * 흐름:
 *   1) localStorage 에 onboarded 미리 set → AuthBootstrap 의 /onboarding redirect 우회
 *   2) 각 페이지 진입 → 응답 200 + viewport 가로 overflow 없음
 *   3) 핵심 element / heading 존재 (변경에 강한 셀렉터)
 *
 * 프로젝트별 (desktop / mobile-chrome / mobile-safari / mobile-pwa) 모두 실행.
 */

/** 페이지 가로 overflow — body.scrollWidth <= viewport width 검증 */
async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const w = document.documentElement.clientWidth;
    const scroll = document.documentElement.scrollWidth;
    return scroll - w;
  });
  // 1px 미만 오차 허용 (sub-pixel rounding)
  expect(overflow, '가로 스크롤이 발생함').toBeLessThanOrEqual(1);
}

const ROUTES: { path: string; mustContain?: RegExp }[] = [
  { path: '/', mustContain: /TripBite|토너먼트|여행/i },
  { path: '/ranking' },
  { path: '/tournament' },
  { path: '/region' },
  { path: '/region/cheongju' },
  { path: '/region/danyang' },
  { path: '/letter' },
  { path: '/letter/compose' },
  { path: '/mypage' },
  { path: '/settings' },
  { path: '/quiz' },
  // 동적 페이지 — destination/region 상세
  { path: '/destination/cheongju-attraction-1' },
  { path: '/destination/danyang-festival-1' },
];

test.describe('페이지 smoke + 가로 overflow', () => {
  test.beforeEach(async ({ page }) => {
    await authedSession(page);
  });

  for (const route of ROUTES) {
    test(`${route.path} 진입 + 가로 overflow 없음`, async ({ page }) => {
      const res = await page.goto(route.path, { waitUntil: 'networkidle' });
      expect(res?.status(), `${route.path} HTTP status`).toBeLessThan(400);

      // 페이지 정상 hydrate 대기
      await page.waitForLoadState('domcontentloaded');

      // 가로 overflow 검증
      await assertNoHorizontalOverflow(page);

      // body 가 비어있지 않음 (페이지 자체가 깨진 경우 검출)
      const bodyText = await page.locator('body').textContent();
      expect(bodyText?.trim().length ?? 0).toBeGreaterThan(0);

      if (route.mustContain) {
        await expect(page.locator('body')).toContainText(route.mustContain);
      }
    });
  }

  test('홈 헤더 / 하단 네비 노출', async ({ page }) => {
    await page.goto('/');
    // 알림 / 설정 아이콘 버튼 — aria-label 기준
    await expect(
      page.getByRole('button', { name: /알림|Notification/i }).first(),
    ).toBeVisible({ timeout: 5000 });
    // "Home" aria 가 로고 + 하단 네비 2 곳에 매칭 — strict mode 회피 .first().
    await expect(
      page.getByRole('link', { name: /홈|Home/i }).first(),
    ).toBeVisible();
  });
});
