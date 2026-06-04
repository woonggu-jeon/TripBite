import { test, expect } from '@playwright/test';
import { authedSession } from './_helpers/auth';

/**
 * Modal a11y 검증 — ConfirmDialog 의 키보드/포커스 인터랙션.
 *
 * 검사 항목:
 *   1) role="dialog" + aria-modal="true" 노출
 *   2) Esc 키로 close → cancel resolve
 *   3) Tab 으로 cancel ↔ confirm 순환 (focus trap)
 *   4) close 시 trigger 버튼으로 focus 복원
 */
test.describe('Modal a11y — ConfirmDialog', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(
      !testInfo.project.name.startsWith('desktop'),
      'Modal a11y 검사는 desktop 계열만',
    );
    await authedSession(page);
  });

  test('회원 탈퇴 confirm — role=dialog + Esc 닫기 + focus 복원', async ({
    page,
  }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle').catch(() => {});

    // 회원 탈퇴 버튼 클릭
    const withdrawBtn = page.getByRole('button', { name: '회원 탈퇴' });
    await withdrawBtn.click();

    // dialog 노출 확인
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');

    // Esc 닫기
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();

    // focus 가 trigger 로 복원되어야 함
    await expect(withdrawBtn).toBeFocused();
  });

  test('로그아웃 confirm — Tab 키로 cancel ↔ confirm 순환', async ({
    page,
  }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle').catch(() => {});

    const logoutBtn = page.getByRole('button', { name: '로그아웃' });
    await logoutBtn.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // 첫 focusable = 취소 버튼 (Button order: 취소, 로그아웃)
    const cancel = dialog.getByRole('button', { name: '취소' });
    const confirm = dialog.getByRole('button', { name: '로그아웃' });
    await expect(cancel).toBeFocused();

    // Tab → confirm
    await page.keyboard.press('Tab');
    await expect(confirm).toBeFocused();

    // Tab → 다시 cancel (focus trap 으로 wrap-around)
    await page.keyboard.press('Tab');
    await expect(cancel).toBeFocused();

    // Shift+Tab → confirm
    await page.keyboard.press('Shift+Tab');
    await expect(confirm).toBeFocused();

    // 정리 — Esc
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });
});
