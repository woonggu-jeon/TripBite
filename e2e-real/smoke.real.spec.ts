import { type Page, expect, test } from '@playwright/test';

/**
 * 실 BE 스모크 — 실제 Spring 응답으로 화면이 정상 렌더/비어있지 않은지 검증.
 *
 * mock e2e 가 못 잡던 클래스를 방어:
 *   - 실 BE 에서만 발생하는 빈 화면(예: 메인 상단 배너가 recommended degrade 로 사라짐).
 *   - 실 로그인/세션(JSESSIONID + marker) 흐름.
 *
 * 실 데이터라 exact 대신 불변식만: 렌더 성공 · uncaught 예외 0 · h1 ≤ 1 ·
 * 핵심 위젯 비어있지 않음.
 */

const TEST_USER = process.env.BE_TEST_USER ?? 'test';
const TEST_PASS = process.env.BE_TEST_PASS ?? '1234';

// uncaught JS 예외만 실패로 — console.error/외부 스크립트 노이즈는 무시.
function trackPageErrors(page: Page): string[] {
  const errs: string[] = [];
  page.on('pageerror', (e) => errs.push(e.message));
  return errs;
}

async function assertRenderInvariants(
  page: Page,
  path: string,
  errs: string[],
) {
  // body 비어있지 않음(렌더 파손 아님)
  const bodyLen =
    (await page.locator('body').textContent())?.trim().length ?? 0;
  expect(bodyLen, `${path} body 비어있음`).toBeGreaterThan(0);
  // 헤더 중복 금지 — h1 ≤ 1
  expect(await page.locator('h1').count(), `${path} h1`).toBeLessThanOrEqual(1);
  // uncaught 예외 0
  expect(errs, `${path} pageerror: ${errs.join(', ')}`).toEqual([]);
}

// 온보딩 우회 — visited 쿠키 없으면 middleware 가 모든 경로를 /onboarding 으로
// 리다이렉트(디바이스 신호). 실제 페이지 검증을 위해 방문 표식 주입.
test.beforeEach(async ({ context }) => {
  await context.addCookies([
    { name: 'tripbite.visited', value: '1', url: 'http://localhost:3000' },
  ]);
});

// ── 공개 라우트 (로그인 불필요) ──
const PUBLIC_ROUTES = ['/', '/ranking', '/region', '/tournament', '/quiz'];

test.describe('실 BE 스모크 — 공개 라우트', () => {
  for (const path of PUBLIC_ROUTES) {
    test(`${path} — 렌더 + 예외0 + h1≤1`, async ({ page }) => {
      const errs = trackPageErrors(page);
      await page.goto(path, { waitUntil: 'networkidle' });
      await assertRenderInvariants(page, path, errs);
    });
  }

  test('홈 상단 추천 배너/카테고리픽 — 실 BE 데이터로 비어있지 않음', async ({
    page,
  }) => {
    // 회귀 방어: recommended 를 destinations/random 으로 전환 → 실 BE 에서도 배너가 떠야 함.
    await page.goto('/', { waitUntil: 'networkidle' });
    // 배너/카테고리픽 슬라이드는 여행지 상세로 링크 → 최소 1개 존재해야 정상.
    await expect(page.locator('a[href^="/destination/"]').first()).toBeVisible({
      timeout: 15_000,
    });
  });
});

// ── 인증 라우트 (실 로그인) ──
test.describe('실 BE 스모크 — 인증 라우트', () => {
  test('로그인(test 계정) → 보호 라우트 렌더', async ({ page }) => {
    const errs = trackPageErrors(page);

    // 실제 로그인 흐름 — BE 세션 발급(JSESSIONID) + marker 쿠키(setAuth) 검증.
    await page.goto('/login', { waitUntil: 'networkidle' });
    await page.locator('#username').fill(TEST_USER);
    await page.locator('#password').fill(TEST_PASS);
    await page.getByRole('button', { name: /로그인|로그인하기|Login/ }).click();
    // useLogin 성공 시 hard nav(window.location.assign) → /login 이탈 대기.
    await page.waitForURL((u) => !u.pathname.startsWith('/login'), {
      timeout: 20_000,
    });

    for (const path of ['/mypage', '/notifications', '/settings']) {
      await page.goto(path, { waitUntil: 'networkidle' });
      // 미인증이면 /login 으로 튕김 — 세션 유효 확인.
      expect(page.url(), `${path} 인증 실패(로그인 리다이렉트)`).not.toContain(
        '/login',
      );
      await assertRenderInvariants(page, path, errs);
    }
  });
});
