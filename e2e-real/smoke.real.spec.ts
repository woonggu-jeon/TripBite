import { type Page, expect, test } from '@playwright/test';

/**
 * 실 BE 스모크 — 실제 Spring 응답으로 화면이 정상 렌더/비어있지 않은지 전수 검증.
 *
 * mock e2e 가 못 잡던 클래스를 방어:
 *   - 실 BE 에서만 발생하는 빈 화면(예: 메인 배너가 recommended degrade 로 사라짐).
 *   - 실 로그인/세션(JSESSIONID + marker) 흐름.
 *   - 다크모드 토큰 적용.
 *
 * 실 데이터라 exact 대신 불변식만: 렌더 성공 · uncaught 예외 0 · h1 ≤ 1(헤더 중복 금지).
 */

const TEST_USER = process.env.BE_TEST_USER ?? 'test';
const TEST_PASS = process.env.BE_TEST_PASS ?? '1234';

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
  const bodyLen =
    (await page.locator('body').textContent())?.trim().length ?? 0;
  expect(bodyLen, `${path} body 비어있음`).toBeGreaterThan(0);
  expect(await page.locator('h1').count(), `${path} h1`).toBeLessThanOrEqual(1);
  expect(errs, `${path} pageerror: ${errs.join(', ')}`).toEqual([]);
}

// 온보딩 우회 — visited 쿠키 없으면 middleware 가 전 경로를 /onboarding 으로 리다이렉트.
test.beforeEach(async ({ context }) => {
  await context.addCookies([
    { name: 'tripbite.visited', value: '1', url: 'http://localhost:3000' },
  ]);
});

// ── 공개 라우트 (로그인 불필요) ──
const PUBLIC_ROUTES = [
  '/',
  '/ranking',
  '/region',
  '/region/cheongju',
  '/region/danyang',
  '/tournament',
  '/quiz',
  '/login',
  '/signup',
  '/policy/terms',
  '/policy/privacy',
  '/policy/licenses',
];

test.describe('실 BE 스모크 — 공개 라우트', () => {
  for (const path of PUBLIC_ROUTES) {
    test(`${path} — 렌더 + 예외0 + h1≤1`, async ({ page }) => {
      const errs = trackPageErrors(page);
      await page.goto(path, { waitUntil: 'networkidle' });
      await assertRenderInvariants(page, path, errs);
    });
  }

  test('홈 상단 추천 배너 — 실 BE 데이터로 비어있지 않음', async ({ page }) => {
    // 회귀 방어: recommended 를 destinations/random 으로 전환 → 실 BE 에서도 배너가 떠야 함.
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.locator('a[href^="/destination/"]').first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test('여행지 상세 — 홈 배너 링크로 실 destination 진입', async ({ page }) => {
    const errs = trackPageErrors(page);
    await page.goto('/', { waitUntil: 'networkidle' });
    const href = await page
      .locator('a[href^="/destination/"]')
      .first()
      .getAttribute('href');
    expect(href, '홈에 destination 링크 없음').toBeTruthy();
    await page.goto(href!, { waitUntil: 'networkidle' });
    await assertRenderInvariants(page, href!, errs);
  });
});

// ── 다크모드 (기본 theme=system → prefers-color-scheme 따름) ──
test.describe('실 BE 스모크 — 다크모드', () => {
  test.use({ colorScheme: 'dark' });

  for (const path of ['/', '/region', '/tournament']) {
    test(`${path} — 다크 토큰 적용 + 렌더(실 BE)`, async ({ page }) => {
      const errs = trackPageErrors(page);
      await page.goto(path, { waitUntil: 'networkidle' });
      await assertRenderInvariants(page, path, errs);
      const luma = await page.evaluate(() => {
        const v = getComputedStyle(document.documentElement)
          .getPropertyValue('--color-bg')
          .trim();
        let r = 255,
          g = 255,
          b = 255;
        if (v.startsWith('#')) {
          const h = v.slice(1);
          const n =
            h.length === 3
              ? h
                  .split('')
                  .map((c) => c + c)
                  .join('')
              : h;
          r = parseInt(n.slice(0, 2), 16);
          g = parseInt(n.slice(2, 4), 16);
          b = parseInt(n.slice(4, 6), 16);
        } else {
          const m = v.match(/\d+/g);
          if (m) [r, g, b] = m.map(Number);
        }
        return 0.299 * r + 0.587 * g + 0.114 * b;
      });
      expect(luma, `${path} --color-bg 다크 아님`).toBeLessThan(90);
    });
  }
});

// ── 인증 라우트 (실 로그인) ──
const AUTHED_ROUTES = [
  '/mypage',
  '/mypage/stamps',
  '/mypage/saved-tournaments',
  '/letter',
  '/letter/compose',
  '/letter/sent',
  '/notifications',
  '/settings',
];

test.describe('실 BE 스모크 — 인증 라우트', () => {
  test('로그인(test 계정) → 보호 라우트 전수 렌더', async ({ page }) => {
    const errs = trackPageErrors(page);

    // 실제 로그인 흐름 — BE 세션 발급(JSESSIONID) + marker 쿠키(setAuth) 검증.
    await page.goto('/login', { waitUntil: 'networkidle' });
    await page.locator('#username').fill(TEST_USER);
    await page.locator('#password').fill(TEST_PASS);
    await page.getByRole('button', { name: /로그인|Login/ }).click();
    await page.waitForURL((u) => !u.pathname.startsWith('/login'), {
      timeout: 20_000,
    });

    for (const path of AUTHED_ROUTES) {
      await page.goto(path, { waitUntil: 'networkidle' });
      // 미인증이면 /login 으로 튕김 — 세션 유효 확인.
      expect(page.url(), `${path} 인증 실패(로그인 리다이렉트)`).not.toContain(
        '/login',
      );
      await assertRenderInvariants(page, path, errs);
      errs.length = 0; // 라우트별 격리
    }
  });
});
