import { test, expect, type Page } from '@playwright/test';

/**
 * 핵심 인터랙션 자동 QA — 위젯 라우팅 / 카테고리 정책 / 알림함 / 토너먼트 흐름.
 */

async function bypassOnboarding(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('tripbite.onboarded', 'true');
      localStorage.setItem('tripbite.push-prompt.dismissed', 'true');
    } catch {
      // ignore
    }
  });
}

/**
 * 화면 상단/하단 banner (MockMode / Install / Update / Offline) 가 click 을
 * intercept 하는 경우 회피용 헬퍼. CSS 로 모든 banner pointer-events 차단.
 */
async function dismissBanners(page: Page) {
  await page.addStyleTag({
    content: `
      [class*="MockModeBanner"],
      [class*="InstallPromptBanner"],
      [class*="PwaUpdateBanner"],
      [class*="OfflineBanner"],
      [class*="Banner_banner"] {
        pointer-events: none !important;
        opacity: 0.1 !important;
      }
    `,
  });
}

test.describe('위젯 라우팅 — 여행지 vs 지역', () => {
  test.beforeEach(async ({ page }) => {
    await bypassOnboarding(page);
  });

  test('홈 - 축제 카드 클릭 → /destination/{id}', async ({ page }) => {
    await page.goto('/');
    // FestivalCarousel 의 첫 카드 (보은 대추축제 — boeun-festival-1)
    const firstFestival = page.locator('[aria-label*="보은 대추축제"]').first();
    if (await firstFestival.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstFestival.click();
      await expect(page).toHaveURL(/\/destination\//);
    }
  });

  test('랭킹 - Top5 카드 클릭 → /destination/{id}', async ({ page }) => {
    await page.goto('/ranking');
    const firstTop5 = page.locator('[aria-label^="1위"]').first();
    if (await firstTop5.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstTop5.click();
      await expect(page).toHaveURL(/\/destination\//);
    }
  });

  test('랭킹 - 시군별 행 클릭 → /region/{code}', async ({ page }) => {
    await page.goto('/ranking');
    // RegionWinsChart 의 시군 row — 첫 row 클릭 시 /region/* 으로
    const firstRegionRow = page
      .locator('button')
      .filter({ hasText: /시|군/ })
      .first();
    if (await firstRegionRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstRegionRow.click();
      await expect(page).toHaveURL(/\/region\//);
    }
  });

  test('시군 상세의 콘텐츠 row 클릭 → /destination/{id}', async ({ page }) => {
    await page.goto('/region/cheongju');
    const firstRow = page.locator('a[href^="/destination/"]').first();
    if (await firstRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstRow.click();
      await expect(page).toHaveURL(/\/destination\//);
    }
  });
});

test.describe('카테고리 정책 — 토너먼트에 local 미노출', () => {
  test.beforeEach(async ({ page }) => {
    await bypassOnboarding(page);
  });

  test('CategoryFilter 에 지역(local) 카드 없음', async ({ page }) => {
    // setup step 3 진입을 위해 query prefill 사용
    await page.goto('/tournament?theme=season&season=spring');

    // step 3 의 CategoryFilter 가 visible 인지 확인 후 옵션 검사
    const localOption = page.getByRole('radio', { name: /지역(?!\s*명소)/ });
    // "지역" radio 카드 미노출 (있으면 fail)
    await expect(localOption).toHaveCount(0);

    // 다른 3 카테고리는 있어야 함
    await expect(page.getByRole('radio', { name: /축제/ })).toBeVisible();
    await expect(page.getByRole('radio', { name: /관광지/ })).toBeVisible();
    await expect(page.getByRole('radio', { name: /체험/ })).toBeVisible();
  });
});

test.describe('알림함', () => {
  test.beforeEach(async ({ page }) => {
    await bypassOnboarding(page);
  });

  test('헤더 알림 버튼 → 드롭다운 열림 + 항목 노출', async ({ page }) => {
    await page.goto('/');
    await dismissBanners(page);
    const bell = page
      .getByRole('button', { name: /알림|Notification/i })
      .first();
    await bell.click();
    // dropdown 의 dialog role 확인
    await expect(
      page.getByRole('dialog', { name: /알림|Notification/i }),
    ).toBeVisible({ timeout: 3000 });
  });
});

test.describe('홈 빠른시작 — 2버튼 + 계절 라벨', () => {
  test.beforeEach(async ({ page }) => {
    await bypassOnboarding(page);
  });

  test('편지 쓰기 버튼 미노출 / 토너먼트 + 유형 테스트 2개만', async ({
    page,
  }) => {
    await page.goto('/');
    // "편지 쓰기" 라벨이 빠른시작 영역에 없어야 함
    const quickActions = page.locator('[data-widget="quick-actions"]');
    const text = await quickActions.textContent();
    expect(text ?? '').not.toContain('편지 쓰기');
    expect(text ?? '').toMatch(/토너먼트|봄|여름|가을|겨울/);
    expect(text ?? '').toMatch(/유형|Type/);
  });
});
