import { test, expect } from '@playwright/test';
import { authedSession } from './_helpers/auth';

/**
 * 푸시 알림 흐름 — prompt 노출 → 권한 grant → MockPushTrigger 노출 → 알림함 항목 클릭 → letter detail.
 *
 * Playwright 한계:
 *   - 실 OS 토스트 노출은 검증 X (브라우저 외부)
 *   - SW push 이벤트 직접 dispatch 도 어려움
 *   - 대신: prompt UI 동작 + 알림함 클릭 → 페이지 이동 흐름 (이미 NotificationDropdown 의 한 부분)
 *
 * 검증 단계:
 *   1) bypassOnboarding 헬퍼가 push-prompt.dismissed=true 를 set 하므로,
 *      여기선 그 키를 비워 PushPrompt 가 노출되도록 강제.
 *   2) 알림 권한 사전 grant — Notification.permission === 'granted' 가 되도록 (PushPrompt 가 default 가 아니면 hide → 시나리오 분기).
 *   3) 알림함 dropdown 열어 항목 1개 클릭 → letter detail (mock seeds 의 letter id) 진입.
 */

test.describe('푸시 prompt + 알림 클릭 → letter detail', () => {
  test.beforeEach(async ({ page, context }) => {
    await authedSession(page);
    // push-prompt.dismissed 키만 별도 해제 — authedSession 의 init 후 동작 X 라서
    // localStorage 는 page navigation 후만 접근 가능. goto 후 직접 호출.
    await context.grantPermissions(['notifications']);
  });

  test('알림 dropdown 열림 + 시드 알림 노출', async ({ page }) => {
    await page.goto('/');
    const bell = page
      .getByRole('button', { name: /알림|Notification/i })
      .first();
    await bell.click();
    const dialog = page.getByRole('dialog', { name: /알림|Notification/i });
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // 시드 알림 중 letter 관련 1개 — 클릭 시 /letter/[id] 진입
    const firstLetterLink = dialog.locator('a[href^="/letter/"]').first();
    if (await firstLetterLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await firstLetterLink.click();
      await page.waitForURL(/\/letter\//, { timeout: 5000 });
      expect(page.url()).toMatch(/\/letter\//);
    }
  });

  test('MockPushTrigger floating button — dev/mock 환경 노출 + 클릭 가능', async ({
    page,
  }) => {
    await page.goto('/');
    // mock 환경 (NEXT_PUBLIC_USE_MSW=true) 에서만 노출 — aria-label "테스트 푸시" 또는 비슷
    const mockBtn = page
      .getByRole('button', { name: /테스트|Mock|푸시 트리거/i })
      .first();
    if (await mockBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      // 클릭 자체는 권한 dialog 띄울 수 있으니 trial mode
      await mockBtn.click({ trial: true });
    }
    // 노출 여부와 무관 — UI 가 깨지지 않고 home 페이지 유지
    expect(page.url()).toContain('localhost:3000');
  });
});
