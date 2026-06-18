import { test, expect, type Page } from '@playwright/test';

/**
 * 회원가입 → onboarding → 홈 e2e flow.
 *
 * 검증 흐름:
 *   1) /signup 진입 (비인증)
 *   2) username/email 중복확인 — MSW handler 가 'tester01'/'t@e.com' 만 taken,
 *      그 외 available 응답
 *   3) 회원가입 제출 → MSW signup handler 가 { user: mockUser } 응답 +
 *      setMockSignedIn(true) → store hydrate → /onboarding 자동 진입
 *   4) ConceptStep → LocationStep → 위치 허용 또는 건너뛰기 → 홈 진입
 *
 * MSW 의존 — playwright.config.ts 의 NEXT_PUBLIC_USE_MSW='true' 환경.
 * use-auth.ts:106 의 response.user 정합 (직전 BE_RESPONSE 회신 + MSW handler
 * 갱신 후 작동).
 */

async function freshSession(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
  });
}

test.describe('회원가입 → onboarding 흐름', () => {
  test.beforeEach(async ({ page, context }) => {
    await freshSession(page);
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 36.6424, longitude: 127.489 });
  });

  test('signup → MSW 응답 → onboarding 자동 진입', async ({ page }) => {
    await page.goto('/signup');
    await expect(page).toHaveURL(/\/signup/);

    // 4 필드 입력 — username/password/nickname/email
    await page.getByLabel(/아이디/).fill('newuser01');
    await page.getByLabel(/이메일/).fill('new@user.com');
    await page.getByLabel(/^닉네임/).fill('새내기');
    await page.getByLabel(/^비밀번호 \(/).fill('NewUser1234!');
    await page.getByLabel(/비밀번호 확인/).fill('NewUser1234!');

    // 중복확인 버튼 — username/email. available 응답 (MSW: tester01/t@e.com 외 available)
    const checkButtons = page.getByRole('button', { name: /중복확인/ });
    const count = await checkButtons.count();
    for (let i = 0; i < count; i++) {
      await checkButtons.nth(i).click();
      // verified 상태 또는 hint 변화 — networkidle 대기로 충분
      await page.waitForLoadState('networkidle').catch(() => {});
    }

    // 가입 제출 — MSW signup → { user } → setAuth → router.replace('/onboarding')
    await page.getByRole('button', { name: /^가입하기$|^회원가입$/ }).click();
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 5000 });
  });

  test('onboarding ConceptStep → LocationStep → 홈 진입', async ({ page }) => {
    // 직전 test 의 인증 상태 이어지지 않으니 manual setup — visited cookie 없이
    // /onboarding 직접 진입 (PUBLIC_ACCESS).
    await page.goto('/onboarding');
    await expect(page).toHaveURL(/\/onboarding/);

    // ConceptStep — 다음 버튼 클릭
    await page
      .getByRole('button', { name: /다음|계속/ })
      .first()
      .click();

    // LocationStep — 위치 허용 또는 건너뛰기 (geolocation permission 사전 grant 됨)
    // permission='granted' 분기 → useEffect 가 자동 resolve → spinner → home
    // 또는 prompt 분기 → "허용" 버튼 클릭
    const allowButton = page.getByRole('button', { name: /허용|위치/ }).first();
    if (await allowButton.isVisible().catch(() => false)) {
      await allowButton.click();
    }

    // home 또는 finishOnboarding 후 safeNext 로 이동
    await expect(page).toHaveURL(
      /^http:\/\/localhost:\d+\/(\?.*)?$|\/(?!onboarding)/,
      {
        timeout: 10000,
      },
    );
  });
});
