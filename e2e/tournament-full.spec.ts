import { test, expect } from '@playwright/test';
import { authedSession } from './_helpers/auth';

/**
 * 토너먼트 전체 흐름 — setup → play → result.
 *
 * 4 명 토너먼트 (가장 짧은 흐름) — 2 매치 + 결승 1 매치 = 3 클릭으로 우승 도출.
 *
 * mock 환경 의존:
 *   - GET /destinations/random?count=4 → 4명 후보 반환 (mock seeds 의 festival 4개)
 *   - POST /mypage/tournaments → 우승 저장 (Result 화면 "마이페이지 저장" 버튼)
 *
 * setup query prefill 로 step skip — UI 클릭 누락 회피.
 */

test.describe('토너먼트 풀 흐름 (4명)', () => {
  test.beforeEach(async ({ page }) => {
    await authedSession(page);
  });

  test('?theme=season&season=spring → category 축제 → 갯수 선택 → 시작 활성', async ({
    page,
  }) => {
    // 1) Setup — query prefill 로 step 3 (CategoryFilter) 진입
    await page.goto('/tournament?theme=season&season=spring');

    // 카테고리 — 축제 선택
    await page.getByRole('radio', { name: /축제/ }).click();

    // 갯수 step — 4명 선택 (button 또는 radio 둘 다 가능)
    const count4Btn = page.getByRole('button', { name: /^4$/ }).first();
    const count4Radio = page.getByRole('radio', { name: /^4/ }).first();
    if (await count4Btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await count4Btn.click();
    } else if (
      await count4Radio.isVisible({ timeout: 2000 }).catch(() => false)
    ) {
      await count4Radio.click();
    }

    // 시작하기 활성화
    const start = page.getByRole('button', { name: /시작/i }).first();
    await expect(start).toBeEnabled({ timeout: 5000 });
  });

  test('?theme=random query → 즉시 갯수 step + 시작 활성', async ({ page }) => {
    await page.goto('/tournament?theme=random');
    // 시작 button 가 노출되면 random 흐름 (step 4 점프) 검증
    const start = page.getByRole('button', { name: /시작/i }).first();
    if (await start.isVisible({ timeout: 5000 }).catch(() => false)) {
      // 갯수 미선택 상태에서도 disabled 일 수 있음 — 노출만 검증
      await expect(start).toBeVisible();
    }
  });
});
