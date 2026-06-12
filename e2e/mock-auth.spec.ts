import { test, expect } from '@playwright/test';
import { authedSession } from './_helpers/auth';

/**
 * Mock 로그인 토글 + 비로그인 흐름 검증.
 *
 * 시나리오:
 *   1) MockAuthToggle 버튼이 헤더 dev slot 에 노출 (USE_MSW=true 빌드)
 *   2) 로그아웃 토글 → mockSignedIn=false → /me 401 → toggle 이 clearAuth
 *   3) 비로그인 상태에서 /mypage 진입 → middleware 가 SID cookie 없음 확인 →
 *      /login?redirect=/mypage 로 SSR redirect
 */
// Serial — 병렬 실행 시 localStorage / mock 상태 race 로 flaky.
// 같은 파일 안에서 logout 토글이 다른 test 의 mock 상태에 영향 주지 않게 순차 실행.
test.describe.configure({ mode: 'serial' });

test.describe('Mock 로그인 토글 + 보호 경로', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(
      !testInfo.project.name.startsWith('desktop'),
      'mock 로그인 시나리오는 desktop 계열만',
    );
    await authedSession(page);
  });

  // 같은 worker 재사용 시 직전 test 의 mockSignedIn 상태가 localStorage 로 누적되므로
  // test 본문 시작 시 강제로 logged-in 상태로 reset.
  async function resetToSignedIn(page: import('@playwright/test').Page) {
    await page.goto('/');
    await page.evaluate(() => {
      try {
        window.localStorage.setItem('__mock_signed_in', 'true');
      } catch {
        /* noop */
      }
    });
    // useMe 가 다시 200 받도록 force-reload.
    await page.reload();
    await page.waitForLoadState('networkidle').catch(() => {});
  }

  test('MockAuthToggle 노출 + 클릭으로 로그아웃 → /mypage 진입 시 /login redirect', async ({
    page,
  }) => {
    await resetToSignedIn(page);

    // 헤더 dev slot 의 mock 로그아웃 버튼
    const toggle = page.getByRole('button', { name: 'mock 로그아웃' });
    await expect(toggle).toBeVisible();
    await toggle.click();

    // 토글 후 라벨이 'mock 로그인' 으로 전환되는지 (MockAuthToggle 의 useMe 가 401 후)
    await expect(page.getByRole('button', { name: 'mock 로그인' })).toBeVisible(
      { timeout: 5000 },
    );

    // 보호 경로 진입 시도 → middleware 가 SID 없음 확인 → /login?redirect= 로 SSR redirect.
    // SSR redirect 라 client-side ABORT race 가능성 적지만 안전망 catch 유지.
    await page.goto('/mypage').catch(() => {});
    await page.waitForURL(/\/login/, { timeout: 15000 });
    // redirect query 가 원래 경로 보존
    expect(page.url()).toContain('redirect=');
    expect(page.url()).toMatch(/redirect=.*mypage/);
  });

  test('비로그인 상태에서 mock 로그인 토글 → 보호 페이지 정상 진입', async ({
    page,
  }) => {
    await resetToSignedIn(page);

    // 먼저 로그아웃
    await page.getByRole('button', { name: 'mock 로그아웃' }).click();
    await expect(page.getByRole('button', { name: 'mock 로그인' })).toBeVisible(
      { timeout: 5000 },
    );

    // 다시 로그인 토글 — 토글 후 /mypage 진입 시 정상 (auth 복구 검증).
    // 버튼 label 자체는 useMe refetch 비동기라 race 가능 — 실제 가치는 보호 경로 진입.
    await page.getByRole('button', { name: 'mock 로그인' }).click();
    await page.waitForLoadState('networkidle').catch(() => {});

    await page.goto('/mypage');
    await expect(page).toHaveURL(/\/mypage(?!\/)/);
    // 프로필 영역이 렌더되면 정상 인증 (mock 로그인 상태)
    await expect(page.getByRole('heading', { name: '프로필' })).toBeVisible({
      timeout: 5000,
    });
  });
});
