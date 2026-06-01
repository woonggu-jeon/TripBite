import { test, expect } from '@playwright/test';
import { authedSession } from './_helpers/auth';

/**
 * 360 viewport (갤럭시 S8 등 작은 모바일) 회귀 검증.
 *
 * 기존 pages-smoke 의 가로 overflow 검증은 mobile-chrome (393px) 기준 — 360 까지는 강제 X.
 * 이 spec 은 360 viewport 를 명시 설정해 더 작은 화면에서도 핵심 페이지가 깨지지 않는지 확인.
 *
 * 검증 대상 — Phase 1-2 신규 위젯이 포함된 페이지:
 *   - /mypage : RegionStampMap (5×3 grid) + LetterboxTabs + SavedTournaments 그리드
 *   - /letter : LetterListPanel 4탭 + InfiniteList
 *   - /region/cheongju : RegionDetailTabs + RegionContentRow
 *   - /tournament : SeasonSelector + CategoryFilter
 *
 * desktop-chrome 만 실행 — projects 매트릭스 곱셈 회피.
 */
test.describe('360 viewport — overflow + 핵심 element 노출', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    // desktop 계열만 viewport override 가능 (mobile 은 device emulation 강제).
    test.skip(
      !testInfo.project.name.startsWith('desktop'),
      '360 회귀는 desktop 계열만 (viewport override)',
    );
    await page.setViewportSize({ width: 360, height: 720 });
    await authedSession(page);
  });

  async function assertNoOverflow(page: import('@playwright/test').Page) {
    const overflow = await page.evaluate(() => {
      const w = document.documentElement.clientWidth;
      const scroll = document.documentElement.scrollWidth;
      return scroll - w;
    });
    expect(overflow, '360 viewport 에서 가로 스크롤 발생').toBeLessThanOrEqual(
      1,
    );
  }

  test('/mypage — RegionStampMap + 위젯 4종 overflow 없음', async ({
    page,
  }) => {
    await page.goto('/mypage');
    await page.waitForLoadState('networkidle').catch(() => {});
    await assertNoOverflow(page);
    // 도장깨기 진행률 라벨 노출 (5/11)
    await expect(page.locator('text=/\\d+ ?\\/ ?11/').first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('/letter — 4탭 segmented + 리스트 overflow 없음', async ({ page }) => {
    await page.goto('/letter');
    await page.waitForLoadState('networkidle').catch(() => {});
    await assertNoOverflow(page);
    // 4탭 노출 (received/sent/liked/saved)
    await expect(page.getByRole('tab', { name: /받은|Received/ })).toBeVisible({
      timeout: 5000,
    });
  });

  test('/region/cheongju — 탭 + row overflow 없음', async ({ page }) => {
    await page.goto('/region/cheongju');
    await page.waitForLoadState('networkidle').catch(() => {});
    await assertNoOverflow(page);
  });

  test('/tournament — setup step overflow 없음', async ({ page }) => {
    await page.goto('/tournament');
    await page.waitForLoadState('networkidle').catch(() => {});
    await assertNoOverflow(page);
  });
});
